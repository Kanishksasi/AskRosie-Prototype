import { useMemo, useState } from "react";

// Multiple clicks per point, not one — WebGazer's regression model is only
// as good as its training data, and a single sample per point is thin. 5
// clicks per point (45 total) gives it enough to actually converge on a
// usable mapping instead of the pointer swimming around afterward.
const CLICKS_PER_POINT = 5;

// 9-point calibration grid. Each click records that screen position against
// the current gaze estimate inside WebGazer's regression model.
export default function EyeCalibration({ onPoint, onDone, onCancel }) {
  const [counts, setCounts] = useState({});

  const points = useMemo(() => {
    const pts = [];
    for (let ry = 0.12; ry <= 0.88; ry += 0.38) {
      for (let rx = 0.1; rx <= 0.9; rx += 0.4) {
        pts.push({ x: rx * window.innerWidth, y: ry * window.innerHeight });
      }
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = Object.values(counts).filter((c) => c >= CLICKS_PER_POINT).length;

  function handleClick(i, p) {
    onPoint(p);
    setCounts((prev) => {
      const next = { ...prev, [i]: (prev[i] || 0) + 1 };
      const allDone = points.every((_, idx) => (next[idx] || 0) >= CLICKS_PER_POINT);
      if (allDone) setTimeout(onDone, 300);
      return next;
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.92)", zIndex: 100 }}>
      <div style={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center" }}>
        <p style={{ color: "#fff", fontSize: 14, margin: "0 0 4px" }}>
          Click each point {CLICKS_PER_POINT} times while looking right at it
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "0 0 10px" }}>
          {doneCount} of {points.length} points done
        </p>
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.5)",
            color: "#fff",
            fontSize: 12,
            padding: "6px 16px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
      {points.map((p, i) => {
        const count = counts[i] || 0;
        const done = count >= CLICKS_PER_POINT;
        return (
          <button
            key={i}
            onClick={() => handleClick(i, p)}
            aria-label={`Calibration point ${i + 1}, ${count} of ${CLICKS_PER_POINT} clicks`}
            style={{
              position: "absolute",
              left: p.x - 16,
              top: p.y - 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid #fff",
              background: done ? "#4caf50" : "var(--ar-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              // Fills in as clicks land, so progress on THIS point is
              // visible without needing to read the counter up top.
              opacity: done ? 1 : 0.4 + (count / CLICKS_PER_POINT) * 0.6,
            }}
          >
            {done ? "" : count || ""}
          </button>
        );
      })}
    </div>
  );
}
