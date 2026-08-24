import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

const SLIDES = [
  { titleKey: "onboard1Title", bodyKey: "onboard1Body", mark: "01" },
  { titleKey: "onboard2Title", bodyKey: "onboard2Body", mark: "02" },
];

export default function Onboarding() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <Screen bg="sage">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, maxWidth: 480 }}>
        <div style={{ marginTop: 40 }}>
          <h1 style={{ fontSize: 24, color: "var(--ar-maroon)", margin: "0 0 8px" }}>{t(slide.titleKey)}</h1>
          <p style={{ fontSize: 14, color: "var(--ar-maroon)", opacity: 0.85, margin: 0 }}>{t(slide.bodyKey)}</p>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: 140,
              fontWeight: 800,
              lineHeight: 1,
              color: "var(--ar-maroon)",
              opacity: 0.14,
              letterSpacing: -4,
            }}
          >
            {slide.mark}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 999,
                background: "var(--ar-maroon)",
                opacity: i === index ? 1 : 0.4,
                transition: "width 160ms ease",
              }}
            />
          ))}
        </div>

        <PrimaryButton
          onClick={() => {
            if (isLast) navigate("/grade");
            // Clamped rather than a bare i + 1: a fast double-tap can fire
            // this handler twice before React re-renders with the updated
            // index, so both calls would otherwise still see isLast=false
            // and both increment, pushing the index past the last slide.
            else setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
          }}
        >
          {isLast ? t("start") : t("next")}
        </PrimaryButton>
      </div>
    </Screen>
  );
}
