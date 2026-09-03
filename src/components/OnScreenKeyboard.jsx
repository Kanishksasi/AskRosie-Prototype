import { useApp } from "../context/AppContext.jsx";

// Fallback text entry for the Chat composer when speech recognition is
// unavailable (Firefox) or the mic is blocked. Every key is a real
// <button> sized for a wobbly head pointer (blink-to-press) and also works
// by touch. Letters only, plus space / backspace / a couple of marks / done
// — this is a "type a short question" tool, not a full IME.
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export default function OnScreenKeyboard({ onKey, onBackspace, onDone }) {
  const { t } = useApp();

  const Key = ({ label, onPress, grow = 1, wide }) => (
    <button
      type="button"
      // Keep focus on the text field — don't let the key steal it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className="ar-osk-key"
      style={{ flex: grow, minWidth: wide ? 64 : 0 }}
    >
      {label}
    </button>
  );

  return (
    <div className="ar-osk" role="group" aria-label={t("kbToggle")}>
      {ROWS.map((row) => (
        <div className="ar-osk-row" key={row}>
          {row.split("").map((c) => (
            <Key key={c} label={c} onPress={() => onKey(c)} />
          ))}
        </div>
      ))}
      <div className="ar-osk-row">
        <Key label="?" onPress={() => onKey("?")} />
        <Key label={t("kbSpace")} onPress={() => onKey(" ")} grow={4} />
        <Key label="." onPress={() => onKey(".")} />
        <Key label="⌫" onPress={onBackspace} grow={1.4} wide />
        <Key label={t("kbDone")} onPress={onDone} grow={1.6} wide />
      </div>
    </div>
  );
}
