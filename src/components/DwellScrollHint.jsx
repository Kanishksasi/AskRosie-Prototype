import { useApp } from "../context/AppContext.jsx";

// Subtle chevron affordances at the top and bottom of the phone frame,
// shown whenever the head pointer is on, so a visitor knows resting the
// pointer at an edge will scroll. The relevant one brightens while a
// dwell-scroll is actually running (see useDwellScroll).
export default function DwellScrollHint() {
  const { prefs, dwellScroll } = useApp();
  if (!prefs.eyeTracking) return null;

  const dir = dwellScroll?.dir ?? 0;

  return (
    <>
      <div className={`ar-dwell-hint ar-dwell-top${dir === -1 ? " ar-dwell-active" : ""}`} aria-hidden="true">
        <span>⌃</span>
      </div>
      <div className={`ar-dwell-hint ar-dwell-bottom${dir === 1 ? " ar-dwell-active" : ""}`} aria-hidden="true">
        <span>⌄</span>
      </div>
    </>
  );
}
