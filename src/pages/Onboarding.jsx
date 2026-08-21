import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

const SLIDES = [
  { titleKey: "onboard1Title", bodyKey: "onboard1Body", emoji: "📷" },
  { titleKey: "onboard2Title", bodyKey: "onboard2Body", emoji: "💬" },
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
            fontSize: 96,
          }}
          aria-hidden="true"
        >
          {slide.emoji}
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
            else setIndex((i) => i + 1);
          }}
        >
          {isLast ? t("start") : t("next")}
        </PrimaryButton>
      </div>
    </Screen>
  );
}
