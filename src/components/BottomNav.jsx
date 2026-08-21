import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const HIDDEN_ON = ["/", "/onboarding", "/grade", "/disclaimer"];

export function useShowBottomNav() {
  const location = useLocation();
  return !HIDDEN_ON.includes(location.pathname);
}

export default function BottomNav() {
  const { t } = useApp();
  const show = useShowBottomNav();
  if (!show) return null;

  const items = [
    { to: "/capture", label: t("home"), icon: "🏠" },
    { to: "/collection", label: t("collectionTitle"), icon: "🖼️" },
    { to: "/favorites", label: t("favoritesTitle"), icon: "♥" },
    { to: "/settings", label: t("settingsTitle"), icon: "⚙️" },
  ];

  return (
    <nav
      className="gg-bottomnav"
      style={{
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: "var(--gg-navh)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        background: "#fff",
        borderTop: "1px solid var(--ar-line)",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
        zIndex: 20,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            fontSize: 10,
            textDecoration: "none",
            color: isActive ? "var(--ar-maroon)" : "#888",
            padding: "4px 10px",
          })}
        >
          <span style={{ fontSize: 18 }} aria-hidden="true">
            {item.icon}
          </span>
          <span style={{ maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
