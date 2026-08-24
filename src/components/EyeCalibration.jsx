import { useMemo, useState } from "react";

// 9-point calibration grid. Each click records that screen position against
// the current gaze estimate inside WebGazer's regression model.
export default function EyeCalibration({ onPoint, onDone, onCancel }) {
  const [clicked, setClicked] = useState(new Set());

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

  function handleClick(i, p) {
    onPoint(p);
    setClicked((prev) => {
      const next = new Set(prev);
      next.add(i);
      if (next.size === points.length) setTimeout(onDone, 300);
      return next;
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.92)", zIndex: 100 }}>
      <div style={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center" }}>
        <p style={{ color: "#fff", fontSize: 14, margin: "0 0 10px" }}>
          Click every point while looking at it — {clicked.size} of {points.length}
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
      {points.map((p, i) => (
        <button
          key={i}
          onClick={() => handleClick(i, p)}
          aria-label={`Calibration point ${i + 1}`}
          style={{
            position: "absolute",
            left: p.x - 12,
            top: p.y - 12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid #fff",
            background: clicked.has(i) ? "#4caf50" : "var(--ar-danger)",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}
