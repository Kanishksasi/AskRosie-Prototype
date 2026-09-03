import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

// Apple's Head Pointer accessibility feature: a screen pointer follows
// head position, and a separate trigger clicks whatever it's over — here,
// a deliberate eye-squeeze (blinkClick), the same "camera-based switch"
// idea Apple's Switch Control offers. Holding the eyes shut longer
// re-centers the pointer instead. See useEyeTracking.js for how head
// position, blink duration, and the "charging" value are detected.
//
// Rendered at the app-shell level (a sibling of BottomNav, not inside the
// scrollable content), fixed-positioned with a z-index above the nav, so
// the pointer and anything it can click are never hidden underneath it —
// including the nav's own links, which stay reachable by head + blink like
// everything else on screen.
const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, label, [tabindex]';

export default function HeadPointer() {
  const { prefs, eyeTracking, dwellScroll, t } = useApp();
  const { gaze, blinkSignal, blinkPoint, blinkCharge, correctToward, status, clickHoldMs, recenterHoldMs, recenterSignal } = eyeTracking;
  const scrolling = dwellScroll?.scrolling;
  const dotRef = useRef(null);
  const lastFiredRef = useRef(0);
  const haloRef = useRef(null);
  const [recentered, setRecentered] = useState(0);

  // Flash a "Re-centered" toast when the long-blink recenter gesture fires.
  useEffect(() => {
    if (!recenterSignal) return;
    setRecentered(recenterSignal);
    const id = setTimeout(() => setRecentered(0), 1600);
    return () => clearTimeout(id);
  }, [recenterSignal]);

  // Fire the click at the position captured just before the blink began —
  // never the live pointer, which by now has drifted and frozen.
  useEffect(() => {
    if (blinkSignal === 0 || blinkSignal === lastFiredRef.current) return;
    lastFiredRef.current = blinkSignal;
    if (scrolling) return; // a blink at a screen edge during a scroll isn't a click
    const point = blinkPoint || gaze;
    if (!point) return;

    // pointerEvents:none on the dot means elementFromPoint always resolves
    // to whatever is actually underneath it, never the dot itself.
    const target = document.elementFromPoint(point.x, point.y);
    target?.click();

    // Continuous drift correction: a successful blink-click on a real,
    // reasonably-sized UI element is a confirmed "the user meant exactly
    // here" signal — nudge the pointer's offset toward that element's
    // center so accuracy keeps improving during ordinary use. Skip
    // oversized targets (a page wrapper, <body>) — their center isn't a
    // meaningful "aimed here" signal.
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
  }, [blinkSignal, blinkPoint, gaze, scrolling, correctToward]);

  // Highlight whatever interactive element the pointer is currently over,
  // so the user can see what a blink will hit before committing to it.
  useEffect(() => {
    if (!gaze) return;
    const el = document.elementFromPoint(gaze.x, gaze.y);
    const target = el?.closest?.(INTERACTIVE) || null;
    if (target === haloRef.current) return;
    haloRef.current?.classList.remove("ar-head-target");
    if (target) target.classList.add("ar-head-target");
    haloRef.current = target;
  }, [gaze]);

  useEffect(
    () => () => {
      haloRef.current?.classList.remove("ar-head-target");
      haloRef.current = null;
    },
    []
  );

  if (!prefs.eyeTracking) return null;

  const lost = status === "lost";
  // 0 → 1 as the eyes stay shut toward a click; past 1 it's "armed".
  const chargeFrac = blinkCharge > 0 ? Math.min(blinkCharge / clickHoldMs, 1) : 0;
  const arming = blinkCharge >= clickHoldMs;
  const recentering = blinkCharge >= recenterHoldMs;

  return (
    <>
      {gaze && (
        <div
          className="ar-head-pointer-wrap"
          aria-hidden="true"
          style={{ position: "fixed", left: gaze.x, top: gaze.y, transform: "translate(-50%, -50%)", zIndex: 9999, pointerEvents: "none", opacity: lost ? 0.35 : 1 }}
        >
          {blinkCharge > 0 && (
            <div
              className="ar-head-charge"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 40,
                height: 40,
                marginLeft: -20,
                marginTop: -20,
                borderRadius: "50%",
                border: `3px solid ${recentering ? "var(--ar-teal)" : arming ? "var(--ar-maroon)" : "rgba(81,30,17,0.4)"}`,
                transform: `scale(${0.5 + chargeFrac * 0.9})`,
                opacity: recentering ? 1 : 0.4 + chargeFrac * 0.6,
                transition: "transform 60ms linear, opacity 60ms linear",
              }}
            />
          )}
          <div
            ref={dotRef}
            className="ar-head-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid var(--ar-maroon)",
              background: "rgba(81, 30, 17, 0.15)",
            }}
          />
        </div>
      )}
      {lost && (
        <div className="ar-head-lost" role="status">
          {t("eyeStatus_lost")}
        </div>
      )}
      {recentered > 0 && (
        <div className="ar-recenter-toast" role="status">
          {t("recenteredToast")}
        </div>
      )}
    </>
  );
}
