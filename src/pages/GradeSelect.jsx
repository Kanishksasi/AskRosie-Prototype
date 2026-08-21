import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

const STUDENT_BANDS = [
  { id: "k5", titleKey: "gradeK5", descKey: "gradeK5Desc", emoji: "🧸" },
  { id: "68", titleKey: "grade68", descKey: "grade68Desc", emoji: "🔭" },
  { id: "912", titleKey: "grade912", descKey: "grade912Desc", emoji: "🖼️" },
];

const ADULT_LEVELS = [
  { id: "novice", titleKey: "levelNovice", descKey: "levelNoviceDesc", emoji: "🌱" },
  { id: "casual", titleKey: "levelCasual", descKey: "levelCasualDesc", emoji: "🎨" },
  { id: "expert", titleKey: "levelExpert", descKey: "levelExpertDesc", emoji: "🎓" },
];

export default function GradeSelect() {
  const { t, prefs, update } = useApp();
  const navigate = useNavigate();

  function choose(id) {
    update({ depthLevel: id });
    navigate("/disclaimer");
  }

  return (
    <Screen>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, maxWidth: 480, gap: 20, overflowY: "auto" }}>
        <div style={{ marginTop: 24 }}>
          <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "0 0 6px" }}>{t("gradeTitle")}</h1>
          <p style={{ fontSize: 14, color: "#555", margin: 0 }}>{t("gradeSubtitle")}</p>
        </div>

        <LevelGroup label={t("studentSectionLabel")} options={STUDENT_BANDS} selected={prefs.depthLevel} onChoose={choose} t={t} />
        <LevelGroup label={t("adultSectionLabel")} options={ADULT_LEVELS} selected={prefs.depthLevel} onChoose={choose} t={t} />

        <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <PrimaryButton onClick={() => navigate("/disclaimer")} style={{ background: "var(--ar-ink)" }}>
            {t("continue")}
          </PrimaryButton>
          <button
            onClick={() => {
              update({ depthLevel: null });
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

function LevelGroup({ label, options, selected, onChoose, t }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#888", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((b) => (
          <button
            key={b.id}
            onClick={() => onChoose(b.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              borderRadius: "var(--ar-radius-lg)",
              border: selected === b.id ? "2px solid var(--ar-maroon)" : "1px solid var(--ar-line)",
              background: "#fff",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 24 }} aria-hidden="true">
              {b.emoji}
            </span>
            <span>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ar-ink)" }}>{t(b.titleKey)}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{t(b.descKey)}</div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
