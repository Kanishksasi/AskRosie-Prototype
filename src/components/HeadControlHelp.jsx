import { useApp } from "../context/AppContext.jsx";

// Shown once right after calibration, and re-openable from Settings. The
// five things a head-only visitor needs to know — every one of them a
// gesture with no on-screen control.
export default function HeadControlHelp({ onClose }) {
  const { t } = useApp();
  const points = ["headHelpMove", "headHelpClick", "headHelpScroll", "headHelpRecenter", "headHelpVoice"];

  return (
    <div className="ar-help-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ar-help-card" onClick={(e) => e.stopPropagation()}>
        <h2>{t("headHelpTitle")}</h2>
        <ul>
          {points.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 999,
            border: "none",
            background: "var(--ar-ink)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("headHelpGot")}
        </button>
      </div>
    </div>
  );
}
