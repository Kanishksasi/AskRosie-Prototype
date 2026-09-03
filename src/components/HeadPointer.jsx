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

// The interactive element at (x,y), or — if the point just missed one —
// the nearest interactive element within a small sweep. The pointer is
// only ever approximately where the user meant, so a near miss should
// still land.
function resolveTarget(x, y) {
  const direct = document.elementFromPoint(x, y)?.closest?.(INTERACTIVE);
  if (direct) return direct;
  for (const r of [12, 22, 32]) {
    for (const [ox, oy] of [
      [0, -r], [0, r], [-r, 0], [r, 0], [-r, -r], [r, -r], [-r, r], [r, r],
    ]) {
      const el = document.elementFromPoint(x + ox, y + oy)?.closest?.(INTERACTIVE);
      if (el) return el;
    }
  }
  return null;
}

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

    // Resolve to a real interactive element. If the exact point isn't on
    // one (it landed in a gap, or a pixel outside a small target), sweep a
    // few nearby offsets before giving up — the pointer is only ever
    // approximately where the user meant.
    const hit = resolveTarget(point.x, point.y);
    if (!hit) return;

    hit.click();

    // Brief flash so the user can see the click landed.
    hit.classList.add("ar-head-clicked");
    setTimeout(() => hit.classList.remove("ar-head-clicked"), 320);

    // Continuous drift correction: a confirmed "the user meant exactly
    // here" signal — nudge the pointer's offset toward the element's
    // center so accuracy keeps improving during ordinary use. Skip
    // oversized targets (a page wrapper, <body>).
    const rect = hit.getBoundingClientRect();
    if (rect.width > 0 && rect.width < 320 && rect.height > 0 && rect.height < 160) {
      correctToward([{ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
    }

    const dot = dotRef.current;
    if (dot) {
      dot.classList.remove("ar-head-pointer-blink");
      void dot.offsetWidth; // restart the animation even on rapid repeat blinks
      dot.classList.add("ar-head-pointer-blink");
    }
  }, [blinkSignal, blinkPoint, gaze, scrolling, correctToward]);

  // Highlight the interactive element a blink would hit right now (same
  // near-miss resolution as the click itself), so the user can see the
  // target before committing.
  useEffect(() => {
    if (!gaze) return;
    const target = resolveTarget(gaze.x, gaze.y);
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
                width: 44,
                height: 44,
                marginLeft: -22,
                marginTop: -22,
                borderRadius: "50%",
                border: `3px solid ${recentering ? "var(--ar-teal)" : arming ? "var(--ar-maroon)" : "rgba(81,30,17,0.45)"}`,
                background: arming && !recentering ? "rgba(81,30,17,0.18)" : "transparent",
                transform: `scale(${arming ? 1 : 0.55 + chargeFrac * 0.45})`,
                opacity: recentering ? 1 : arming ? 1 : 0.45 + chargeFrac * 0.55,
                transition: "transform 50ms linear, opacity 50ms linear",
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
              border: `2px solid ${recentering ? "var(--ar-teal)" : "var(--ar-maroon)"}`,
              background: recentering
                ? "var(--ar-teal)"
                : arming
                ? "var(--ar-maroon)"
                : "rgba(81, 30, 17, 0.15)",
              transition: "background 60ms linear",
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
