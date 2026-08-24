import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export function Screen({ children, bg = "cream", center = false }) {
  return (
    <div
      style={{
        flex: "1 1 auto",
        minHeight: 0,
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
    <header
      style={{
        padding: "20px 24px 8px",
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

export function Modal({ open, onClose, title, children }) {
  const { t } = useApp();
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
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            padding: "6px 12px",
            borderRadius: 0,
            border: "1px solid var(--ar-ink)",
            background: "#fff",
            color: "var(--ar-ink)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {t("close")}
        </button>
        {title && <h2 style={{ margin: "0 32px 8px 0", fontSize: 18, color: "var(--ar-maroon)" }}>{title}</h2>}
        <div style={{ fontSize: 14, lineHeight: 1.6, color: "#333" }}>{children}</div>
      </div>
    </div>
  );
}

const ART_PATTERNS = ["ar-pattern-strokes", "ar-pattern-dots", "ar-pattern-waves"];

export function ArtworkArt({ artwork, height = 220, radius = 16 }) {
  // Falls back to the gradient placeholder if `artwork.image` is missing
  // OR if it's set but fails to actually load (broken path, network
  // hiccup, source taken down) — never leaves a broken-image icon showing.
  const [imageFailed, setImageFailed] = useState(false);

  if (!artwork) return null;

  if (artwork.image && !imageFailed) {
    return (
      <div style={{ height, borderRadius: radius, position: "relative", overflow: "hidden" }}>
        <img
          src={artwork.image}
          alt={`${artwork.title} by ${artwork.artist}`}
          onError={() => setImageFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <span
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            fontSize: 11,
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            padding: "3px 8px",
            borderRadius: 999,
          }}
        >
          demo image
        </span>
      </div>
    );
  }

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
