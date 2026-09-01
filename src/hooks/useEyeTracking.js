import { useCallback, useEffect, useRef, useState } from "react";

const WEBGAZER_SRC = "https://webgazer.cs.brown.edu/webgazer.js";
// WebGazer's own default (`faceMeshSolutionPath: "./mediapipe/face_mesh"`)
// is relative to the CURRENT PAGE's origin, not webgazer.js's own CDN —
// meaning on any domain other than webgazer.cs.brown.edu itself, it tries
// to fetch its face-mesh model from a path this app doesn't have. That 404
// gets caught by the SPA fallback route and returns index.html instead,
// which the browser then tries to parse as JS ("Unexpected token '<'"),
// leaving webgazer's internal state broken and .begin() throwing. Pointing
// it at MediaPipe's real, absolute CDN location fixes this on every host.
const FACE_MESH_SOLUTION_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1657299874";
const TASKS_VISION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// A blink is "both eyes' blendshape score crosses this" — MediaPipe's
// documented rule of thumb for a genuine blink on an average face.
const BLINK_THRESHOLD = 0.55;
// Minimum gap between registered blinks. Long enough that a single blink
// (eyes closed for a few frames) can't fire twice, short enough that two
// deliberate, separate blinks still both count.
const BLINK_COOLDOWN_MS = 700;

let scriptPromise = null;
function loadWebgazer() {
  if (window.webgazer) return Promise.resolve(window.webgazer);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WEBGAZER_SRC;
    script.async = true;
    script.onload = () => resolve(window.webgazer);
    script.onerror = () => reject(new Error("Failed to load WebGazer"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let visionModulePromise = null;
function loadVisionModule() {
  if (visionModulePromise) return visionModulePromise;
  // Loaded from jsdelivr as a real ES module, same CDN-script pattern as
  // WebGazer above — no bundler dependency, no model files to ship.
  visionModulePromise = import(/* @vite-ignore */ TASKS_VISION_CDN);
  return visionModulePromise;
}

// WebGazer's own showVideoPreview(false) sets the video element's CSS
// display to "none" on every browser except Firefox (confirmed by reading
// its source — it special-cases Firefox to use opacity instead, precisely
// because display:none is known to be risky elsewhere). On iOS Safari in
// particular, a display:none <video> stops decoding frames entirely, which
// would silently freeze BOTH WebGazer's own gaze estimation and this
// hook's blink detection at once — the two of them share this one video
// feed. So we never call showVideoPreview(false): instead the video stays
// display:block (still actively decoding) and we hide it ourselves with
// styles that don't stop rendering — tiny, transparent, pinned off in a
// corner, unclickable.
function concealVideoFeed() {
  const conceal = (el) => {
    if (!el) return;
    Object.assign(el.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "2px",
      height: "2px",
      opacity: "0",
      pointerEvents: "none",
      overflow: "hidden",
    });
  };
  conceal(document.getElementById("webgazerVideoFeed"));
  conceal(document.getElementById("webgazerVideoContainer"));
}

// Experimental, opt-in, webcam-based head pointer — modeled on Apple's Head
// Pointer accessibility feature, but driven by gaze instead of head
// position: `gaze` is where the pointer should sit, and `blinkSignal`
// increments once per detected blink (both eyes closing together), the
// same "camera-based switch" trigger Apple's Switch Control offers for
// clicking without a mouse. Approximate, browser-based estimation — not
// clinical-grade tracking.
//
// Gaze (WebGazer) and blink (MediaPipe FaceLandmarker, reusing WebGazer's
// video feed instead of requesting the camera a second time) are
// deliberately supervised as two INDEPENDENT pipelines: `status` reflects
// gaze alone, so a MediaPipe failure (unsupported WASM/WebGL, blocked
// model download, whatever) only costs blink-clicking, not the whole
// pointer — degrading gracefully instead of an all-or-nothing failure.
export function useEyeTracking(enabled) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | denied | error
  const [gaze, setGaze] = useState(null);
  const [blinkSignal, setBlinkSignal] = useState(0);
  const gazerRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastBlinkAtRef = useRef(0);
  const eyesClosedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      if (gazerRef.current) {
        try {
          gazerRef.current.end();
        } catch {
          /* noop */
        }
        gazerRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      setStatus("idle");
      setGaze(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    // --- Gaze pipeline (required) ---
    loadWebgazer()
      .then(async (webgazer) => {
        if (cancelled) return;
        if (webgazer.params) webgazer.params.faceMeshSolutionPath = FACE_MESH_SOLUTION_PATH;
        webgazer
          .setRegression("ridge")
          .setGazeListener((data) => {
            if (!data || cancelled) return;
            setGaze({ x: data.x, y: data.y });
          })
          .saveDataAcrossSessions(false);

        await webgazer.begin();
        if (cancelled) return;
        // Deliberately NOT showVideoPreview(false) — see concealVideoFeed().
        webgazer.showVideoPreview(true).showPredictionPoints(false);
        concealVideoFeed();
        gazerRef.current = webgazer;
        setStatus("ready");

        // --- Blink pipeline (best-effort, doesn't affect `status`) ---
        try {
          const { FaceLandmarker, FilesetResolver } = await loadVisionModule();
          const filesetResolver = await FilesetResolver.forVisionTasks(`${TASKS_VISION_CDN}/wasm`);
          const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            // CPU, not GPU: WebGazer already runs its own GPU-backed face
            // model against this same camera feed. Two simultaneous WebGL
            // consumers can exhaust a browser's (especially mobile's)
            // limited context budget and silently lose one — CPU avoids
            // that contention entirely; blink detection doesn't need
            // video framerate to feel responsive.
            baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: "CPU" },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
          });
          if (cancelled) {
            landmarker.close();
            return;
          }
          landmarkerRef.current = landmarker;

          const detectLoop = () => {
            if (cancelled) return;
            const videoEl = document.getElementById("webgazerVideoFeed");
            if (!videoEl || videoEl.readyState < 2) {
              rafRef.current = requestAnimationFrame(detectLoop);
              return;
            }
            const result = landmarker.detectForVideo(videoEl, performance.now());
            const shapes = result?.faceBlendshapes?.[0]?.categories;
            if (shapes) {
              const left = shapes.find((c) => c.categoryName === "eyeBlinkLeft")?.score ?? 0;
              const right = shapes.find((c) => c.categoryName === "eyeBlinkRight")?.score ?? 0;
              const eyesClosed = left > BLINK_THRESHOLD && right > BLINK_THRESHOLD;
              const now = performance.now();
              // Fire on the closing edge only, not for every frame the
              // eyes stay shut, so a single blink is exactly one click.
              if (eyesClosed && !eyesClosedRef.current && now - lastBlinkAtRef.current > BLINK_COOLDOWN_MS) {
                lastBlinkAtRef.current = now;
                setBlinkSignal((n) => n + 1);
              }
              eyesClosedRef.current = eyesClosed;
            }
            rafRef.current = requestAnimationFrame(detectLoop);
          };
          rafRef.current = requestAnimationFrame(detectLoop);
        } catch (err) {
          // Gaze pointer keeps working; blink-clicking just won't fire.
          // Logged (not surfaced in the UI) so this is diagnosable without
          // pretending the whole feature failed.
          console.error("Eye-tracking: blink detection failed to start, gaze pointer still active.", err);
        }
      })
      .catch((err) => {
        console.error("Eye-tracking: failed to start.", err);
        if (cancelled) return;
        // A denied/blocked camera permission is by far the most common
        // real-world failure, and the fix is different from every other
        // failure mode (a browser site-setting, not something a reload
        // fixes) — worth its own status so the UI can say that plainly
        // instead of a generic "something went wrong."
        setStatus(err?.name === "NotAllowedError" ? "denied" : "error");
      });

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // True unmount (app teardown), independent of the `enabled` toggle above —
  // that effect only tears down webgazer/mediapipe when the pref flips to
  // false, not when this hook's owner unmounts. Without this, a hard app
  // unmount would leave the camera stream running forever.
  useEffect(() => {
    return () => {
      try {
        gazerRef.current?.end();
      } catch {
        /* noop */
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close?.();
    };
  }, []);

  const calibrate = useCallback((points) => {
    const gz = gazerRef.current;
    if (!gz) return;
    points.forEach(({ x, y }) => gz.recordScreenPosition(x, y, "click"));
  }, []);

  return { status, gaze, blinkSignal, calibrate };
}
