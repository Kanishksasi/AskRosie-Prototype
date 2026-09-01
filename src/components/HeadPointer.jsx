import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";

// Apple's Head Pointer accessibility feature moves a screen pointer with
// head position and clicks via a separate trigger (dwell, or a Switch
// Control facial gesture like a blink). This mirrors that, but the pointer
// follows gaze instead of head position, and the trigger is always a
// blink — both eyes closing together, detected in useEyeTracking.js.
//
// Rendered at the app-shell level (a sibling of BottomNav, not inside the
// scrollable content), fixed-positioned with a z-index above the nav, so
// the pointer and anything it can click are never hidden underneath it —
// including the nav's own links, which stay reachable by gaze + blink like
// everything else on screen.
export default function HeadPointer() {
  const { prefs, eyeTracking } = useApp();
  const { gaze, blinkSignal, calibrate } = eyeTracking;
  const dotRef = useRef(null);
  const lastFiredRef = useRef(0);

  useEffect(() => {
    if (blinkSignal === 0 || blinkSignal === lastFiredRef.current || !gaze) return;
    lastFiredRef.current = blinkSignal;

    // pointerEvents:none on the dot means elementFromPoint always resolves
    // to whatever is actually underneath it, never the dot itself.
    const target = document.elementFromPoint(gaze.x, gaze.y);
    target?.click();

    // Continuous self-calibration: a successful blink-click on a real,
    // reasonably-sized UI element is a much better ground-truth signal
    // than the raw gaze reading that triggered it — the user was
    // presumably aiming at that element, not at wherever the model
    // currently thinks their eyes are. Feeding its center back into the
    // regression lets accuracy keep improving during ordinary use instead
    // of only during the one-time calibration screen. Skip oversized
    // targets (a page wrapper, <body>) — their center isn't a meaningful
    // "the user was looking exactly here" signal.
    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 300 && rect.height > 0 && rect.height < 150) {
        calibrate([{ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
      }
    }

    const dot = dotRef.current;
    if (dot) {
      dot.classList.remove("ar-head-pointer-blink");
      void dot.offsetWidth; // restart the animation even on rapid repeat blinks
      dot.classList.add("ar-head-pointer-blink");
    }
  }, [blinkSignal, gaze, calibrate]);

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
