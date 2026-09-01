import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";

// Apple's Head Pointer accessibility feature: a screen pointer follows
// head position, and a separate trigger clicks whatever it's over — here,
// blinking both eyes together, the same "camera-based switch" idea Apple's
// Switch Control offers. See useEyeTracking.js for how head position and
// blinks are actually detected (one MediaPipe pipeline, no eye-gaze
// regression).
//
// Rendered at the app-shell level (a sibling of BottomNav, not inside the
// scrollable content), fixed-positioned with a z-index above the nav, so
// the pointer and anything it can click are never hidden underneath it —
// including the nav's own links, which stay reachable by head + blink like
// everything else on screen.
export default function HeadPointer() {
  const { prefs, eyeTracking } = useApp();
  const { gaze, blinkSignal, correctToward } = eyeTracking;
  const dotRef = useRef(null);
  const lastFiredRef = useRef(0);

  useEffect(() => {
    if (blinkSignal === 0 || blinkSignal === lastFiredRef.current || !gaze) return;
    lastFiredRef.current = blinkSignal;

    // pointerEvents:none on the dot means elementFromPoint always resolves
    // to whatever is actually underneath it, never the dot itself.
    const target = document.elementFromPoint(gaze.x, gaze.y);
    target?.click();

    // Continuous drift correction: a successful blink-click on a real,
    // reasonably-sized UI element is a confirmed "the user meant exactly
    // here" signal — nudge the pointer's offset toward that element's
    // center so accuracy keeps improving during ordinary use, not just
    // right after calibration. Skip oversized targets (a page wrapper,
    // <body>) — their center isn't a meaningful "aimed here" signal.
    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 300 && rect.height > 0 && rect.height < 150) {
        correctToward([{ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
      }
    }

    const dot = dotRef.current;
    if (dot) {
      dot.classList.remove("ar-head-pointer-blink");
      void dot.offsetWidth; // restart the animation even on rapid repeat blinks
      dot.classList.add("ar-head-pointer-blink");
    }
  }, [blinkSignal, gaze, correctToward]);

  if (!prefs.eyeTracking || !gaze) return null;

  return (
    <div
      ref={dotRef}
      className="ar-head-pointer"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: gaze.x,
        top: gaze.y,
        transform: "translate(-50%, -50%)",
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "2px solid var(--ar-maroon)",
        background: "rgba(81, 30, 17, 0.15)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
