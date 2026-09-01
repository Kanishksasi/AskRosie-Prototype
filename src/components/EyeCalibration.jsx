import { useState } from "react";

// Head-pointer calibration is a single step now, not a multi-point grid —
// head position is tracked as an offset from "forward," not a per-user
// gaze regression, so there's only one reference point to set: wherever
// your head is when you press the button becomes center.
export default function EyeCalibration({ onRecenter, onDone, onCancel }) {
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    onRecenter();
    setConfirmed(true);
    setTimeout(onDone, 500);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,20,20,0.92)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ color: "#fff", fontSize: 16, margin: "0 0 8px", fontWeight: 600 }}>
          Sit normally and face the screen straight on
        </p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0, maxWidth: 320 }}>
          Whatever position you're in when you press the button becomes center — the pointer moves from there as you
          turn or tilt your head.
        </p>
      </div>

      <button
        onClick={handleClick}
        disabled={confirmed}
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          border: "3px solid #fff",
          background: confirmed ? "#4caf50" : "var(--ar-maroon)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.3,
          cursor: confirmed ? "default" : "pointer",
          transition: "background 150ms ease",
        }}
      >
        {confirmed ? "Centered" : "Set center"}
      </button>

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
  );
}
