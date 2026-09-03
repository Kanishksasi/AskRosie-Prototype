import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, PrimaryButton } from "../components/ui.jsx";

const STUDENT_BANDS = [
  { id: "k5", titleKey: "gradeK5", descKey: "gradeK5Desc", badge: "K–5" },
  { id: "68", titleKey: "grade68", descKey: "grade68Desc", badge: "6–8" },
  { id: "912", titleKey: "grade912", descKey: "grade912Desc", badge: "9–12" },
];

const ADULT_LEVELS = [
  { id: "novice", titleKey: "levelNovice", descKey: "levelNoviceDesc", badge: "NEW" },
  { id: "casual", titleKey: "levelCasual", descKey: "levelCasualDesc", badge: "CAS" },
  { id: "expert", titleKey: "levelExpert", descKey: "levelExpertDesc", badge: "EXP" },
];

const TEACHER_LEVELS = [
  { id: "teacher", titleKey: "levelTeacher", descKey: "levelTeacherDesc", badge: "EDU" },
];

const GROUPS = [
  { key: "student", labelKey: "studentSectionLabel", options: STUDENT_BANDS },
  { key: "adult", labelKey: "adultSectionLabel", options: ADULT_LEVELS },
  { key: "teacher", labelKey: "teacherSectionLabel", options: TEACHER_LEVELS },
];

const EMPTY = { student: null, adult: null, teacher: null };

export default function GradeSelect() {
  const { t, prefs, update } = useApp();
  const navigate = useNavigate();

  const selections = prefs.levelSelections || EMPTY;

  // Each group holds its own choice. The most recently tapped option is the
  // "primary" — it drives Rosie's tone and the visual complexity tier
  // (getUiTier). Any other still-selected options ride along as extra
  // context on each request (see Chat.jsx / server/systemPrompt.js), e.g.
  // "a teacher who also wants expert-level depth."
  //
  // Selecting an option only records the preference and highlights the
  // chip — it must NOT navigate on its own. Only "Continue" (or "Skip")
  // moves on, so a visitor can look at their choice or read the other
  // options first instead of being bounced to the next page on tap.
  function choose(groupKey, id) {
    const nextForGroup = selections[groupKey] === id ? null : id;
    const nextSelections = { ...selections, [groupKey]: nextForGroup };
    const nextPrimary = nextForGroup || Object.values(nextSelections).find(Boolean) || null;
    update({ levelSelections: nextSelections, depthLevel: nextPrimary });
  }

  return (
    <Screen>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, maxWidth: 480, gap: 20, overflowY: "auto" }}>
        <div style={{ marginTop: 24 }}>
          <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "0 0 6px" }}>{t("gradeTitle")}</h1>
          <p style={{ fontSize: 14, color: "#555", margin: "0 0 4px" }}>{t("gradeSubtitle")}</p>
          <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{t("gradeMultiHint")}</p>
        </div>

        {GROUPS.map((g) => (
          <LevelGroup
            key={g.key}
            label={t(g.labelKey)}
            options={g.options}
            selectedId={selections[g.key]}
            primaryId={prefs.depthLevel}
            onChoose={(id) => choose(g.key, id)}
            t={t}
          />
        ))}

        <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <PrimaryButton onClick={() => navigate("/disclaimer")} style={{ background: "var(--ar-ink)" }}>
            {t("continue")}
          </PrimaryButton>
          <button
            onClick={() => {
              update({ depthLevel: null, levelSelections: { ...EMPTY } });
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

function LevelGroup({ label, options, selectedId, primaryId, onChoose, t }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#888", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((b) => {
          const isSelected = selectedId === b.id;
          const isPrimary = primaryId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onChoose(b.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: "var(--ar-radius-lg)",
                border: isSelected ? "2px solid var(--ar-maroon)" : "1px solid var(--ar-line)",
                background: "#fff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${isSelected ? "var(--ar-maroon)" : "var(--ar-ink)"}`,
                  color: isSelected ? "var(--ar-maroon)" : "var(--ar-ink)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}
              >
                {b.badge}
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ar-ink)" }}>{t(b.titleKey)}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{t(b.descKey)}</div>
              </span>
              {isSelected && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    color: isPrimary ? "#fff" : "var(--ar-maroon)",
                    background: isPrimary ? "var(--ar-maroon)" : "transparent",
                    border: isPrimary ? "none" : "1px solid var(--ar-maroon)",
                    borderRadius: 999,
                    padding: "3px 8px",
                  }}
                >
                  {isPrimary ? t("gradePrimary") : t("gradeAlsoNoted")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
