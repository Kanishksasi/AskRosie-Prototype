import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

export default function Disclaimer() {
  const { t, update } = useApp();
  const navigate = useNavigate();

  return (
    <Screen center>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          textAlign: "center",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#333" }}>{t("disclaimerBody")}</p>
      </div>
      <div style={{ padding: "0 24px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <PrimaryButton
          onClick={() => {
            update({ onboarded: true });
            navigate("/capture");
          }}
        >
          {t("iUnderstand")}
        </PrimaryButton>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
          <a href="#privacy" style={{ fontSize: 12, color: "#333", textDecoration: "underline" }}>
            {t("privacyPolicy")} ↗
          </a>
          <a href="#terms" style={{ fontSize: 12, color: "#333", textDecoration: "underline" }}>
            {t("termsOfUse")} ↗
          </a>
        </div>
      </div>
    </Screen>
  );
}
