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
    { to: "/capture", label: t("navHome") },
    { to: "/collection", label: t("navCollection") },
    { to: "/settings", label: t("navSettings") },
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
        padding: "10px 4px calc(10px + env(safe-area-inset-bottom))",
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
            gap: 6,
            fontSize: 12,
            fontWeight: isActive ? 700 : 500,
            letterSpacing: 0.2,
            textDecoration: "none",
            color: isActive ? "var(--ar-maroon)" : "#888",
            padding: "4px 14px",
          })}
        >
          {({ isActive }) => (
            <>
              {item.label}
              <span
                aria-hidden="true"
                style={{
                  width: isActive ? 18 : 0,
                  height: 2,
                  background: "var(--ar-maroon)",
                  transition: "width 160ms ease",
                }}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
