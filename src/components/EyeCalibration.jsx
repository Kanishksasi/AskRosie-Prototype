import { useState } from "react";

// 9-point calibration grid. Each click records that screen position against
// the current gaze estimate inside WebGazer's regression model.
export default function EyeCalibration({ onPoint, onDone }) {
  const [clicked, setClicked] = useState(new Set());
  const points = [];
  for (let ry = 0.12; ry <= 0.88; ry += 0.38) {
    for (let rx = 0.1; rx <= 0.9; rx += 0.4) {
      points.push({ x: rx * window.innerWidth, y: ry * window.innerHeight });
    }
  }

  function handleClick(i, p) {
    onPoint(p);
    const next = new Set(clicked);
    next.add(i);
    setClicked(next);
    if (next.size === points.length) setTimeout(onDone, 300);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.9)", zIndex: 100 }}>
      <p style={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 14 }}>
        Click every dot while looking at it ({clicked.size}/{points.length})
      </p>
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
