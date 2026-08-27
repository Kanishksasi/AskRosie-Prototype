import { useCallback, useEffect, useRef, useState } from "react";

const WEBGAZER_SRC = "https://webgazer.cs.brown.edu/webgazer.js";
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

// Experimental, opt-in, webcam-based head pointer — modeled on Apple's Head
// Pointer accessibility feature, but driven by gaze instead of head
// position: `gaze` is where the pointer should sit, and `blinkSignal`
// increments once per detected blink (both eyes closing together), the
// same "camera-based switch" trigger Apple's Switch Control offers for
// clicking without a mouse. Approximate, browser-based estimation — not
// clinical-grade tracking. Fails closed: any load/permission error just
// leaves gaze/blink inert and reports status "error".
//
// Blink detection reuses WebGazer's own webcam stream (via its injected
// <video id="webgazerVideoFeed">) instead of requesting camera access a
// second time — MediaPipe only needs a video element to read frames from,
// it doesn't need to own the stream.
export function useEyeTracking(enabled) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
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

    Promise.all([loadWebgazer(), loadVisionModule()])
      .then(async ([webgazer, { FaceLandmarker, FilesetResolver }]) => {
        if (cancelled) return;

        webgazer
          .setRegression("ridge")
          .setGazeListener((data) => {
            if (!data || cancelled) return;
            setGaze({ x: data.x, y: data.y });
          })
          .saveDataAcrossSessions(false);

        await webgazer.begin();
        if (cancelled) return;
        webgazer.showVideoPreview(false).showPredictionPoints(false);
        gazerRef.current = webgazer;

        const filesetResolver = await FilesetResolver.forVisionTasks(`${TASKS_VISION_CDN}/wasm`);
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: "GPU" },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setStatus("ready");

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
            // Fire on the closing edge only, not for every frame the eyes
            // stay shut, so a single blink is exactly one click.
            if (eyesClosed && !eyesClosedRef.current && now - lastBlinkAtRef.current > BLINK_COOLDOWN_MS) {
              lastBlinkAtRef.current = now;
              setBlinkSignal((n) => n + 1);
            }
            eyesClosedRef.current = eyesClosed;
          }
          rafRef.current = requestAnimationFrame(detectLoop);
        };
        rafRef.current = requestAnimationFrame(detectLoop);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
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
