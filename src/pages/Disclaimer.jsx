import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

export default function Disclaimer() {
  const { t, update } = useApp();
  const navigate = useNavigate();

  return (
    <Screen>
      {/* Text sits near the top and an explicit flex-grow spacer pushes the
          footer to the true bottom of the screen — matching the proven
          pattern in Onboarding.jsx. Previously this relied on
          justify-content centering two sibling blocks as one group, which
          on a short viewport could crowd the button up against the text. */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{ paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#333", margin: 0 }}>{t("disclaimerBody")}</p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: 8 }}>
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
      </div>
    </Screen>
  );
}
