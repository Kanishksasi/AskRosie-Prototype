import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, Header, PrimaryButton } from "../components/ui.jsx";

export default function Landing() {
  const { t } = useApp();
  const navigate = useNavigate();
  return (
    <Screen bg="sage">
      <Header />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 24,
          gap: 24,
          maxWidth: 480,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 88,
            height: 44,
            borderRadius: "44px 44px 0 0",
            background: "var(--ar-maroon)",
            alignSelf: "center",
            marginBottom: 12,
          }}
        />
        <div>
          <h1 style={{ fontSize: 28, lineHeight: 1.15, color: "var(--ar-maroon)", margin: "0 0 12px" }}>
            {t("heroTitle")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ar-maroon)", opacity: 0.85, margin: 0 }}>{t("heroSubtitle")}</p>
        </div>
        <PrimaryButton onClick={() => navigate("/onboarding")}>{t("getStarted")}</PrimaryButton>
      </div>
    </Screen>
  );
}
