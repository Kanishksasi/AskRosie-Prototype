import { useEffect, useRef, useState } from "react";

// Dwell-to-scroll for the head pointer. Resting the pointer in the top or
// bottom strip of whatever is scrollable under it auto-scrolls that
// element — no blink needed (a blink is a click; you don't want to "click"
// a screen edge). This is how eye-gaze / head-pointer scrolling works on
// dedicated assistive tech (Tobii, Apple's Dwell Control).
//
// Driven entirely by the pointer position — no camera internals — so it's
// its own hook, not part of useEyeTracking. The detect loop calls setGaze
// every frame, which re-runs the effect below; that IS the scroll tick.
// During a blink the pointer freezes and setGaze pauses, so scrolling
// pauses too, which is the behaviour you want.

const DWELL_MS = 400; // rest in a zone this long before it starts scrolling
const RAMP_MS = 1500; // reach full speed this long after it starts
const MIN_SPEED = 3; // px per frame at the start
const MAX_SPEED = 18; // px per frame at full ramp
const EDGE_FRACTION = 0.15; // top/bottom 15% of the scroll area are the zones
const ZONE_SLACK = 60; // px the pointer may wander and still count as "held"

function findScrollable(el) {
  let node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight - node.clientHeight > 4) return node;
    node = node.parentElement;
  }
  const doc = document.scrollingElement || document.documentElement;
  return doc && doc.scrollHeight - doc.clientHeight > 4 ? doc : null;
}

function viewportRectFor(el) {
  if (el === document.scrollingElement || el === document.documentElement || el === document.body) {
    return { top: 0, bottom: window.innerHeight, height: window.innerHeight };
  }
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, height: r.height };
}

export function useDwellScroll(gaze, active) {
  const [state, setState] = useState({ scrolling: false, dir: 0 });
  const zoneRef = useRef(null); // { el, dir, x, y, since }
  const rampSinceRef = useRef(0);

  useEffect(() => {
    const stop = () => {
      zoneRef.current = null;
      rampSinceRef.current = 0;
      setState((s) => (s.scrolling ? { scrolling: false, dir: 0 } : s));
    };

    if (!active || !gaze) {
      stop();
      return;
    }

    const now = performance.now();
    const under = document.elementFromPoint(gaze.x, gaze.y);
    const scrollEl = findScrollable(under);
    if (!scrollEl) return stop();

    const rect = viewportRectFor(scrollEl);
    const nav = document.querySelector(".gg-bottomnav");
    const bottomInset = nav ? nav.getBoundingClientRect().height : 0;
    const topBand = rect.top + rect.height * EDGE_FRACTION;
    const bottomBand = rect.bottom - bottomInset - rect.height * EDGE_FRACTION;

    const atTop = scrollEl.scrollTop <= 0;
    const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;

    let dir = 0;
    if (gaze.y <= topBand && !atTop) dir = -1;
    else if (gaze.y >= bottomBand && !atBottom) dir = 1;
    if (dir === 0) return stop();

    const z = zoneRef.current;
    const held =
      z &&
      z.el === scrollEl &&
      z.dir === dir &&
      Math.abs(z.x - gaze.x) < ZONE_SLACK &&
      Math.abs(z.y - gaze.y) < ZONE_SLACK;

    if (!held) {
      zoneRef.current = { el: scrollEl, dir, x: gaze.x, y: gaze.y, since: now };
      rampSinceRef.current = 0;
      setState((s) => (s.scrolling ? { scrolling: false, dir: 0 } : s));
      return;
    }

    if (now - z.since < DWELL_MS) return; // still arming

    if (!rampSinceRef.current) rampSinceRef.current = now;
    const rampFrac = Math.min(1, (now - rampSinceRef.current) / RAMP_MS);
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * rampFrac;
    scrollEl.scrollBy(0, dir * speed);
    setState((s) => (s.scrolling && s.dir === dir ? s : { scrolling: true, dir }));
  }, [gaze, active]);

  return state;
}
