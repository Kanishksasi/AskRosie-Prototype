import { useCallback, useEffect, useRef, useState } from "react";

const TASKS_VISION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Stable, widely-documented landmark indices in MediaPipe's face mesh
// topology — the outer corners of each eye. Their midpoint is a steadier
// "head center" reference than a single nose-tip point: eyes sit on a
// flat, consistently-tracked part of the face, while the nose's exact
// apex varies more between faces and camera angles.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

// A blink is "both eyes' blendshape score crosses this" — MediaPipe's
// documented rule of thumb for a genuine blink on an average face.
const BLINK_THRESHOLD = 0.55;
// Minimum gap between registered blinks. Long enough that a single blink
// (eyes closed for a few frames) can't fire twice, short enough that two
// deliberate, separate blinks still both count.
const BLINK_COOLDOWN_MS = 700;
// How much a normalized head-position shift (0-1 across the camera frame)
// moves the pointer, as a multiple of the screen dimension. Tuned for a
// comfortable, non-extreme head turn to cover most of the screen — the one
// knob to adjust if the pointer feels too twitchy (lower it) or too stiff
// (raise it) once tested against a real camera.
const SENSITIVITY_X = 20;
const SENSITIVITY_Y = 20;
// How strongly a blink-click's observed error nudges the drift-correction
// offset — a partial correction so one stray click can't overcorrect, but
// repeated clicks in the same direction steadily fix a real drift.
const DRIFT_CORRECTION_RATE = 0.3;

let visionModulePromise = null;
function loadVisionModule() {
  if (visionModulePromise) return visionModulePromise;
  // Loaded from jsdelivr as a real ES module — no bundler dependency, no
  // model files to ship ourselves.
  visionModulePromise = import(/* @vite-ignore */ TASKS_VISION_CDN);
  return visionModulePromise;
}

// Keeps an element technically visible (never display:none) but visually
// a non-factor — a lesson learned the hard way from WebGazer: a hidden
// video element can silently stop decoding frames on iOS Safari, which
// would freeze this whole pipeline with no obvious error.
function conceal(el) {
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
}

// Apple's Head Pointer accessibility feature, reimplemented for the web: a
// pointer follows head position, and blinking both eyes together clicks
// whatever it's over — the same "camera-based switch" trigger Apple's
// Switch Control offers for clicking without a mouse. Approximate,
// browser-based estimation — not clinical-grade tracking.
//
// One camera stream, one MediaPipe FaceLandmarker instance, driving both
// signals (head position from face landmarks, blink from blendshapes) —
// no separate gaze-regression library. Head pose is a far more forgiving
// signal than eye gaze from a single webcam: it's a large, deliberate
// movement instead of a sub-pixel pupil estimate, so it needs no
// per-user training model, just one "this is forward" reference point
// (see `recenter`).
export function useEyeTracking(enabled) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | denied | error
  const [gaze, setGaze] = useState(null);
  const [blinkSignal, setBlinkSignal] = useState(0);

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastBlinkAtRef = useRef(0);
  const eyesClosedRef = useRef(false);
  const neutralRef = useRef(null); // {x,y} normalized head-center at "forward"
  const biasRef = useRef({ x: 0, y: 0 }); // screen-space drift correction
  const smoothedRef = useRef(null); // last smoothed screen point
  const lastPointerRef = useRef(null); // last computed point, for correctToward's error calc

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    videoRef.current?.remove();
    videoRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    neutralRef.current = null;
    biasRef.current = { x: 0, y: 0 };
    smoothedRef.current = null;
    lastPointerRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      teardown();
      setStatus("idle");
      setGaze(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        conceal(video);
        document.body.appendChild(video);
        videoRef.current = video;
        await video.play();

        const { FaceLandmarker, FilesetResolver } = await loadVisionModule();
        const filesetResolver = await FilesetResolver.forVisionTasks(`${TASKS_VISION_CDN}/wasm`);
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          // CPU, not GPU: keeps this robust on lower-end/mobile devices
          // without fighting other page content for a WebGL context.
          // Head-pose + blink detection don't need video framerate to
          // feel responsive.
          baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: "CPU" },
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
          const videoEl = videoRef.current;
          if (!videoEl || videoEl.readyState < 2) {
            rafRef.current = requestAnimationFrame(detectLoop);
            return;
          }

          const result = landmarker.detectForVideo(videoEl, performance.now());

          const landmarks = result?.faceLandmarks?.[0];
          if (landmarks) {
            const l = landmarks[LEFT_EYE_OUTER];
            const r = landmarks[RIGHT_EYE_OUTER];
            const center = { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 };
            if (!neutralRef.current) neutralRef.current = center;

            const dx = center.x - neutralRef.current.x;
            const dy = center.y - neutralRef.current.y;
            // Mirrored horizontally so turning your head right moves the
            // pointer right, matching how you see yourself on a webcam —
            // not how the raw, unmirrored camera frame is laid out.
            const rawX = window.innerWidth / 2 - dx * SENSITIVITY_X * window.innerWidth;
            const rawY = window.innerHeight / 2 + dy * SENSITIVITY_Y * window.innerHeight;
            const point = {
              x: Math.min(window.innerWidth, Math.max(0, rawX + biasRef.current.x)),
              y: Math.min(window.innerHeight, Math.max(0, rawY + biasRef.current.y)),
            };

            // Light smoothing on top of the raw per-frame reading — head
            // pose is far steadier than eye gaze to begin with, but this
            // still takes the edge off frame-to-frame landmark noise.
            const prev = smoothedRef.current;
            const smoothed = prev ? { x: prev.x * 0.5 + point.x * 0.5, y: prev.y * 0.5 + point.y * 0.5 } : point;
            smoothedRef.current = smoothed;
            lastPointerRef.current = smoothed;
            setGaze(smoothed);
          }

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
      } catch (err) {
        console.error("Head-tracking: failed to start.", err);
        if (cancelled) return;
        // A denied/blocked camera permission is by far the most common
        // real-world failure, and the fix is different from every other
        // failure mode (a browser site-setting, not something a reload
        // fixes) — worth its own status so the UI can say that plainly.
        setStatus(err?.name === "NotAllowedError" ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, teardown]);

  // True unmount (app teardown), independent of the `enabled` toggle above
  // — that effect only tears things down when the pref flips to false, not
  // when this hook's owner unmounts. Without this, a hard app unmount
  // would leave the camera stream running forever.
  useEffect(() => teardown, [teardown]);

  // "Forward" calibration: whatever head position you're in RIGHT NOW
  // becomes the new zero-offset center. Call this once, facing the screen
  // normally, and the pointer starts centered from there. Nulling the ref
  // lets the next detection frame re-seed it, rather than needing to
  // duplicate that centering logic here.
  const recenter = useCallback(() => {
    neutralRef.current = null;
    biasRef.current = { x: 0, y: 0 };
  }, []);

  // Continuous drift correction: a successful blink-click on a real UI
  // element is a confirmed "the user meant exactly here" signal — nudge
  // the bias offset toward closing the gap between where the pointer
  // actually was and where it should have been, so accuracy keeps
  // improving during ordinary use instead of only right after `recenter`.
  const correctToward = useCallback((points) => {
    const last = lastPointerRef.current;
    const target = points?.[0];
    if (!last || !target) return;
    biasRef.current = {
      x: biasRef.current.x + (target.x - last.x) * DRIFT_CORRECTION_RATE,
      y: biasRef.current.y + (target.y - last.y) * DRIFT_CORRECTION_RATE,
    };
  }, []);

  return { status, gaze, blinkSignal, recenter, correctToward };
}
