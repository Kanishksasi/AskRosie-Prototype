import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

const BANDS = [
  { id: "k5", titleKey: "gradeK5", descKey: "gradeK5Desc", emoji: "🧸" },
  { id: "68", titleKey: "grade68", descKey: "grade68Desc", emoji: "🔭" },
  { id: "912", titleKey: "grade912", descKey: "grade912Desc", emoji: "🖼️" },
];

export default function GradeSelect() {
  const { t, prefs, update } = useApp();
  const navigate = useNavigate();

  function choose(id) {
    update({ gradeBand: id });
    navigate("/disclaimer");
  }

  return (
    <Screen>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, maxWidth: 480, gap: 20 }}>
        <div style={{ marginTop: 32 }}>
          <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "0 0 6px" }}>{t("gradeTitle")}</h1>
          <p style={{ fontSize: 14, color: "#555", margin: 0 }}>{t("gradeSubtitle")}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {BANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => choose(b.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                borderRadius: "var(--ar-radius-lg)",
                border: prefs.gradeBand === b.id ? "2px solid var(--ar-maroon)" : "1px solid var(--ar-line)",
                background: "#fff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 28 }} aria-hidden="true">
                {b.emoji}
              </span>
              <span>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ar-ink)" }}>{t(b.titleKey)}</div>
                <div style={{ fontSize: 13, color: "#666" }}>{t(b.descKey)}</div>
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <PrimaryButton onClick={() => navigate("/disclaimer")} style={{ background: "var(--ar-ink)" }}>
            {t("continue")}
          </PrimaryButton>
          <button
            onClick={() => {
              update({ gradeBand: null });
              navigate("/disclaimer");
            }}
            style={{ background: "none", border: "none", color: "#777", fontSize: 13, cursor: "pointer" }}
          >
            {t("gradeSkip")}
          </button>
        </div>
      </div>
    </Screen>
  );
}
