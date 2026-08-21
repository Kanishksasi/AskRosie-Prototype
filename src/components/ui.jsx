import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export function Screen({ children, bg = "cream", center = false }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: bg === "sage" ? "var(--ar-sage)" : "var(--ar-cream)",
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {children}
    </div>
  );
}

export function Header({ dark = false }) {
  const { prefs, update, t } = useApp();
  return (
    <header style={{ padding: "20px 24px 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
            color: dark ? "var(--ar-maroon)" : "var(--ar-maroon)",
          }}
        >
          {t("appName")}
        </Link>
        <button
          onClick={() => update({ lang: prefs.lang === "en" ? "es" : "en" })}
          style={{
            background: "none",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ar-maroon)",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {t("switchLang")}
        </button>
      </div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.2,
          color: dark ? "#8a8a8a" : "rgba(81,30,17,0.65)",
          marginTop: 4,
        }}
      >
        {t("prototypeLabel")}
      </div>
    </header>
  );
}

export function PrimaryButton({ children, onClick, type = "button", disabled, style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px 20px",
        borderRadius: "var(--ar-radius-full)",
        border: "none",
        background: disabled ? "#7a7a7a" : "var(--ar-ink)",
        color: "#fff",
        fontSize: 15,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 120ms ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, label, active, style }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid var(--ar-line)",
        background: active ? "var(--ar-maroon)" : "#fff",
        color: active ? "#fff" : "var(--ar-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 18,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,20,20,0.45)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          borderRadius: "20px 20px 0 0",
          padding: "24px 24px 32px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "#eee",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        {title && <h2 style={{ margin: "0 32px 8px 0", fontSize: 18, color: "var(--ar-maroon)" }}>{title}</h2>}
        <div style={{ fontSize: 14, lineHeight: 1.6, color: "#333" }}>{children}</div>
      </div>
    </div>
  );
}

const ART_PATTERNS = ["ar-pattern-strokes", "ar-pattern-dots", "ar-pattern-waves"];

export function ArtworkArt({ artwork, height = 220, radius = 16 }) {
  if (!artwork) return null;
  const [c1, c2, c3] = artwork.palette;
  const pattern = ART_PATTERNS[artwork.id.length % ART_PATTERNS.length];
  return (
    <div
      role="img"
      aria-label={`Placeholder artwork image for ${artwork.title} by ${artwork.artist}`}
      className={pattern}
      style={{
        height,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${c1}, ${c2} 55%, ${c3})`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        padding: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          background: "rgba(0,0,0,0.35)",
          color: "#fff",
          padding: "3px 8px",
          borderRadius: 999,
        }}
      >
        demo placeholder
      </span>
    </div>
  );
}
