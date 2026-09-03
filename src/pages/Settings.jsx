import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, Header } from "../components/ui.jsx";
import EyeCalibration from "../components/EyeCalibration.jsx";
import HeadControlHelp from "../components/HeadControlHelp.jsx";

const GRADE_OPTIONS = [
  { id: null, labelKey: "gradeSkip" },
  { id: "k5", labelKey: "gradeK5" },
  { id: "68", labelKey: "grade68" },
  { id: "912", labelKey: "grade912" },
  { id: "novice", labelKey: "levelNovice" },
  { id: "casual", labelKey: "levelCasual" },
  { id: "expert", labelKey: "levelExpert" },
  { id: "teacher", labelKey: "levelTeacher" },
];

const CB_OPTIONS = [
  { id: "none", labelKey: "cbNone" },
  { id: "protanopia", labelKey: "cbProtanopia" },
  { id: "deuteranopia", labelKey: "cbDeuteranopia" },
  { id: "tritanopia", labelKey: "cbTritanopia" },
];

const STUDENT_IDS = ["k5", "68", "912"];

export default function Settings() {
  const { t, prefs, update, eyeTracking } = useApp();
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { status: eyeStatus, recenter } = eyeTracking;

  // A flat grade pick here overrides the nuanced multi-group choice from
  // the onboarding screen: it becomes the sole primary and clears the rest.
  function chooseGrade(id) {
    const group = id === null ? null : STUDENT_IDS.includes(id) ? "student" : id === "teacher" ? "teacher" : "adult";
    const sel = { student: null, adult: null, teacher: null };
    if (group) sel[group] = id;
    update({ depthLevel: id, levelSelections: sel });
  }

  return (
    <Screen>
      <Header dark />
      <div style={{ padding: "0 24px 60px", maxWidth: 560, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 28 }}>
        <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "8px 0 0" }}>{t("settingsTitle")}</h1>

        <Field label={t("settingsGrade")}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GRADE_OPTIONS.map((g) => (
              <Chip key={String(g.id)} active={prefs.depthLevel === g.id} onClick={() => chooseGrade(g.id)}>
                {t(g.labelKey)}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t("settingsColorblind")}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CB_OPTIONS.map((c) => (
              <Chip key={c.id} active={prefs.colorblindMode === c.id} onClick={() => update({ colorblindMode: c.id })}>
                {t(c.labelKey)}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t("settingsDescriptive")} help={t("settingsDescriptiveHelp")}>
          <Toggle checked={prefs.descriptiveMode} onChange={(v) => update({ descriptiveMode: v })} />
        </Field>

        <Field label={t("settingsReadAloud")}>
          <Toggle checked={prefs.readAloud} onChange={(v) => update({ readAloud: v })} />
        </Field>

        <Field label={t("settingsHighContrast")}>
          <Toggle checked={prefs.highContrast} onChange={(v) => update({ highContrast: v })} />
        </Field>

        <Field label={t("settingsColorIntensity")} help={t("settingsColorIntensityHelp")}>
          <AdjustRow
            value={prefs.colorIntensity}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => update({ colorIntensity: v })}
            label={t("settingsColorIntensity")}
            t={t}
          />
        </Field>

        <Field label={t("settingsTextSize")}>
          <AdjustRow
            value={prefs.fontScale}
            min={0.9}
            max={1.6}
            step={0.1}
            onChange={(v) => update({ fontScale: v })}
            label={t("settingsTextSize")}
            t={t}
          />
        </Field>

        <Field label={t("settingsEyeTracking")} help={t("settingsEyeTrackingHelp")}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Toggle checked={prefs.eyeTracking} onChange={(v) => { update({ eyeTracking: v }); setCalibrated(false); }} />
            {prefs.eyeTracking && (
              <>
                <span
                  style={{
                    fontSize: 12,
                    color: eyeStatus === "error" || eyeStatus === "denied" ? "var(--ar-danger)" : "#777",
                    maxWidth: 280,
                  }}
                >
                  {t(`eyeStatus_${eyeStatus}`)}
                </span>
                <button
                  onClick={() => setCalibrating(true)}
                  disabled={eyeStatus !== "ready"}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 0,
                    border: "1px solid var(--ar-ink)",
                    background: calibrated ? "var(--ar-ink)" : "#fff",
                    color: calibrated ? "#fff" : "var(--ar-ink)",
                    fontSize: 12,
                    letterSpacing: 0.3,
                    cursor: eyeStatus === "ready" ? "pointer" : "not-allowed",
                    opacity: eyeStatus === "ready" ? 1 : 0.4,
                  }}
                >
                  {calibrated ? t("recalibrate") : t("calibrate")}
                </button>
                <button
                  onClick={() => setHelpOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: 12,
                    color: "var(--ar-teal)",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {t("headHelpReopen")}
                </button>
              </>
            )}
          </div>
        </Field>

        <Link to="/staff-review" style={{ fontSize: 12, color: "#888", textDecoration: "underline" }}>
          {t("staffNavLabel")}
        </Link>
      </div>

      {calibrating && (
        <EyeCalibration
          onRecenter={recenter}
          onDone={() => {
            setCalibrating(false);
            setCalibrated(true);
            setHelpOpen(true);
          }}
          onCancel={() => setCalibrating(false)}
        />
      )}

      {helpOpen && <HeadControlHelp onClose={() => setHelpOpen(false)} />}
    </Screen>
  );
}

function AdjustRow({ value, min, max, step, onChange, label, t }) {
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`${t("stepDown")} — ${label}`}
        style={stepBtnStyle(value <= min)}
      >
        −
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`${t("stepUp")} — ${label}`}
        style={stepBtnStyle(value >= max)}
      >
        +
      </button>
      <span style={{ fontSize: 12, color: "#666", width: 40, textAlign: "right" }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

function stepBtnStyle(disabled) {
  return {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: 8,
    border: "1px solid var(--ar-ink)",
    background: "#fff",
    color: "var(--ar-ink)",
    fontSize: 18,
    lineHeight: 1,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1,
  };
}

function Field({ label, help, children }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: help ? 4 : 8 }}>{label}</div>
      {help && <p style={{ fontSize: 12, color: "#777", margin: "0 0 8px" }}>{help}</p>}
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: active ? "2px solid var(--ar-maroon)" : "1px solid var(--ar-line)",
        background: active ? "var(--ar-maroon)" : "#fff",
        color: active ? "#fff" : "var(--ar-ink)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        border: "none",
        background: checked ? "var(--ar-maroon)" : "#ccc",
        position: "relative",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 140ms ease",
        }}
      />
    </button>
  );
}
