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
// A closure only counts as a real blink (not an eye flutter or a landmark
// glitch) if the score PEAKS above this at some point while the eyes are
// shut. Uses the average of the two eyes so a slightly lazy eye — very
// common — doesn't block every click.
const BLINK_CONFIRM_PEAK = 0.5;
// The eyelids start moving — and the eye-corner landmarks start drifting —
// as soon as the score lifts off zero. From this low score on, the pointer
// freezes in place and the blink's clock starts, so it can't lurch (almost
// always downward) at the instant of a click and so even a quick blink is
// timed from its true start.
const BLINK_FREEZE_ENTER = 0.22;
// Keep the pointer frozen this long after the eyes reopen, too — the
// landmarks take a few frames to resettle once the lids are back up.
const FREEZE_RELEASE_MS = 250;
// The click lands wherever the pointer was aimed the instant the blink
// began (captured on the closing edge, with this tiny extra look-back to
// cover a fast frame-to-frame transition) — never the live reading, which
// by click time is frozen and was already drifting.
const PRE_BLINK_LOOKBACK_MS = 90;
// A click is any deliberate blink from CLICK_MIN_MS up to RECENTER_HOLD_MS
// of eyes-closed — "a normal blink, held a touch longer." There is no
// upper dead band: a click blink that runs long still clicks. Holding
// clearly longer (past RECENTER_HOLD_MS) re-centers the pointer instead —
// the one hands-free maintenance gesture.
const CLICK_MIN_MS = 190;
const RECENTER_HOLD_MS = 1500;
// Minimum gap between registered clicks. Short enough that if the first
// try doesn't land, a second blink right after still counts.
const BLINK_COOLDOWN_MS = 380;
// No face in frame for this long → status flips to "lost" so the UI can
// say "move back into view" instead of leaving a silently frozen pointer.
const FACE_LOST_MS = 1000;
// Rolling position history depth — a handful of frames, enough to look
// back PRE_BLINK_LOOKBACK_MS at any realistic framerate.
const HISTORY_LEN = 16;
// How much a normalized head-position shift (0-1 across the camera frame)
// moves the pointer, as a multiple of the app's own width/height (not the
// browser window — see APP_SELECTOR below). Lower = a bigger head turn
// needed to cross the screen (steadier, less twitchy); higher = a smaller
// turn covers more ground. This is the one knob to adjust if it still
// feels off once tested against a real camera.
const SENSITIVITY_X = 9;
const SENSITIVITY_Y = 9;
// The pointer is confined to (and scaled against) this element's own
// bounds, not window.innerWidth/innerHeight — on desktop the app renders
// as a centered phone-frame card narrower than the full browser window,
// with a decorative backdrop around it that isn't part of the app at all.
// Without this, the pointer could wander into that backdrop, well past
// anything it could actually click.
const APP_SELECTOR = ".gg-phone";
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

// Nearest history sample at or before `targetT`, else the oldest we have.
function historyPointAt(history, targetT) {
  if (history.length === 0) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].t <= targetT) return history[i];
  }
  return history[0];
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
  const [status, setStatus] = useState("idle"); // idle | loading | ready | lost | denied | error
  const [gaze, setGaze] = useState(null);
  const [blinkSignal, setBlinkSignal] = useState(0);
  const [blinkCharge, setBlinkCharge] = useState(0); // ms eyes have been held shut, 0 when open
  const [recenterSignal, setRecenterSignal] = useState(0); // bumps on a hands-free (long-blink) recenter

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastBlinkAtRef = useRef(0);
  const eyesClosedRef = useRef(false);
  const blinkStartRef = useRef(0); // performance.now() when the closure began (score lifted off zero)
  const blinkPeakRef = useRef(0); // highest blink score seen during the current closure
  const neutralRef = useRef(null); // {x,y} normalized head-center at "forward"
  const biasRef = useRef({ x: 0, y: 0 }); // screen-space drift correction
  const smoothedRef = useRef(null); // last smoothed screen point
  const lastPointerRef = useRef(null); // last committed point, for correctToward's error calc
  const historyRef = useRef([]); // rolling [{x,y,t}] for pre-blink lookback
  const preBlinkPointRef = useRef(null); // pointer position captured at the blink's closing edge
  const blinkPointRef = useRef(null); // where the most recent click was actually sent
  const freezeUntilRef = useRef(0); // performance.now() until which setGaze is suppressed
  const lastFaceAtRef = useRef(0);
  const lostRef = useRef(false);
  const lastChargeRef = useRef(0);

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
    historyRef.current = [];
    preBlinkPointRef.current = null;
    blinkPointRef.current = null;
    freezeUntilRef.current = 0;
    lostRef.current = false;
    lastChargeRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) {
      teardown();
      setStatus("idle");
      setGaze(null);
      setBlinkCharge(0);
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
        lastFaceAtRef.current = performance.now();
        setStatus("ready");

        const detectLoop = () => {
          if (cancelled) return;
          const videoEl = videoRef.current;
          if (!videoEl || videoEl.readyState < 2) {
            rafRef.current = requestAnimationFrame(detectLoop);
            return;
          }

          const now = performance.now();
          const result = landmarker.detectForVideo(videoEl, now);
          const landmarks = result?.faceLandmarks?.[0];

          if (landmarks) {
            lastFaceAtRef.current = now;
            if (lostRef.current) {
              lostRef.current = false;
              setStatus("ready");
            }

            const l = landmarks[LEFT_EYE_OUTER];
            const r = landmarks[RIGHT_EYE_OUTER];
            const center = { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 };
            if (!neutralRef.current) neutralRef.current = center;

            const dx = center.x - neutralRef.current.x;
            const dy = center.y - neutralRef.current.y;

            // Bound (and scale) against the app's own card, not the raw
            // browser window — see APP_SELECTOR above. Falls back to the
            // window if that element isn't found for some reason, so this
            // never just breaks.
            const appEl = document.querySelector(APP_SELECTOR);
            const bounds = appEl
              ? appEl.getBoundingClientRect()
              : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight };

            // Mirrored horizontally so turning your head right moves the
            // pointer right, matching how you see yourself on a webcam —
            // not how the raw, unmirrored camera frame is laid out.
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const rawX = centerX - dx * SENSITIVITY_X * bounds.width;
            const rawY = centerY + dy * SENSITIVITY_Y * bounds.height;
            const point = {
              x: Math.min(bounds.right, Math.max(bounds.left, rawX + biasRef.current.x)),
              y: Math.min(bounds.bottom, Math.max(bounds.top, rawY + biasRef.current.y)),
            };

            // Light smoothing on top of the raw per-frame reading — head
            // pose is far steadier than eye gaze to begin with, but this
            // still takes the edge off frame-to-frame landmark noise.
            const prev = smoothedRef.current;
            const smoothed = prev ? { x: prev.x * 0.5 + point.x * 0.5, y: prev.y * 0.5 + point.y * 0.5 } : point;
            smoothedRef.current = smoothed;

            const history = historyRef.current;
            history.push({ x: smoothed.x, y: smoothed.y, t: now });
            if (history.length > HISTORY_LEN) history.shift();

            // Suppress the pointer update while a blink is in progress (or
            // just finished) so it holds exactly where it was aimed.
            if (now >= freezeUntilRef.current) {
              lastPointerRef.current = smoothed;
              setGaze(smoothed);
            }
          } else if (!lostRef.current && now - lastFaceAtRef.current > FACE_LOST_MS) {
            lostRef.current = true;
            setStatus("lost");
          }

          const shapes = result?.faceBlendshapes?.[0]?.categories;
          if (shapes) {
            const left = shapes.find((c) => c.categoryName === "eyeBlinkLeft")?.score ?? 0;
            const right = shapes.find((c) => c.categoryName === "eyeBlinkRight")?.score ?? 0;
            // Average of the two eyes, not the minimum — one slightly lazy
            // eye shouldn't swallow every click.
            const blinkScore = (left + right) / 2;
            const closing = blinkScore > BLINK_FREEZE_ENTER;

            if (closing) {
              freezeUntilRef.current = now + FREEZE_RELEASE_MS;

              // Rising edge of a closure: start the clock and snapshot the
              // aim point NOW, before the eyelids have moved the landmarks.
              if (!eyesClosedRef.current) {
                blinkStartRef.current = now;
                blinkPeakRef.current = blinkScore;
                preBlinkPointRef.current =
                  historyPointAt(historyRef.current, now - PRE_BLINK_LOOKBACK_MS) || smoothedRef.current;
              } else {
                blinkPeakRef.current = Math.max(blinkPeakRef.current, blinkScore);
              }
            } else if (eyesClosedRef.current) {
              // Falling edge: the closure ended. Classify it — but only if
              // the eyes actually closed hard enough at some point for it
              // to be a real blink and not landmark noise.
              const dur = now - blinkStartRef.current;
              if (blinkPeakRef.current >= BLINK_CONFIRM_PEAK) {
                if (dur >= RECENTER_HOLD_MS) {
                  neutralRef.current = null;
                  biasRef.current = { x: 0, y: 0 };
                  historyRef.current = [];
                  freezeUntilRef.current = now + 400; // let the new center settle
                  setRecenterSignal((n) => n + 1);
                } else if (dur >= CLICK_MIN_MS && now - lastBlinkAtRef.current > BLINK_COOLDOWN_MS) {
                  lastBlinkAtRef.current = now;
                  const p = preBlinkPointRef.current || smoothedRef.current;
                  blinkPointRef.current = p;
                  lastPointerRef.current = p; // correctToward measures error from the aimed point
                  setBlinkSignal((n) => n + 1);
                }
                // dur < CLICK_MIN_MS: a reflex blink — ignored
              }
            }
            eyesClosedRef.current = closing;

            // Charging indicator for the pointer ring. Only push state on a
            // meaningful change so an open, steady eye adds no renders.
            const charge = closing ? now - blinkStartRef.current : 0;
            if (Math.abs(charge - lastChargeRef.current) > 40 || (charge === 0) !== (lastChargeRef.current === 0)) {
              lastChargeRef.current = charge;
              setBlinkCharge(charge);
            }
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
    historyRef.current = [];
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

  return {
    status,
    gaze,
    blinkSignal,
    blinkPoint: blinkPointRef.current,
    blinkCharge,
    recenterSignal,
    recenter,
    correctToward,
    // thresholds the pointer UI needs to render its charging ring
    clickHoldMs: CLICK_MIN_MS,
    recenterHoldMs: RECENTER_HOLD_MS,
  };
}
