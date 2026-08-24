import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { t as translate } from "../data/strings.js";
import { useEyeTracking } from "../hooks/useEyeTracking.js";

const AppContext = createContext(null);

const STORAGE_KEY = "askrosie:prefs:v1";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const DEFAULT_PREFS = {
  lang: "en",
  depthLevel: null, // "k5" | "68" | "912" | null
  colorblindMode: "none", // none | protanopia | deuteranopia | tritanopia
  descriptiveMode: false,
  readAloud: false,
  highContrast: false,
  colorIntensity: 1, // 0 (grayscale) - 2 (vivid), 1 = normal
  fontScale: 1,
  eyeTracking: false,
  onboarded: false,
};

export function AppProvider({ children }) {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...loadPrefs() }));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;

    // All three visual-accessibility controls (colorblind simulation,
    // high contrast, color intensity) work by composing CSS `filter`
    // functions. `filter` doesn't merge across separate class rules — only
    // one declaration wins — so every active effect has to be combined
    // into a single inline filter string here rather than toggled via
    // independent CSS classes fighting over the same property.
    const filters = [];
    if (prefs.colorblindMode !== "none") filters.push(`url(#ar-${prefs.colorblindMode})`);
    if (prefs.highContrast) filters.push("contrast(1.4)");
    if (prefs.colorIntensity !== 1) filters.push(`saturate(${prefs.colorIntensity})`);
    root.style.filter = filters.join(" ");

    root.classList.toggle("ar-high-contrast", !!prefs.highContrast);

    // Text-size control: most of the app sets explicit pixel font sizes
    // (not rem/em), so a root font-size change has no effect on them.
    // `zoom` rescales rendered size (text AND layout) directly, which
    // works regardless of how individual components set their sizes.
    // Applied to .gg-scroll-area (the actual page content) rather than
    // <body>, so the desktop phone-frame chrome doesn't rescale with it.
    const scrollArea = document.querySelector(".gg-scroll-area");
    if (scrollArea) scrollArea.style.zoom = String(prefs.fontScale || 1);
  }, [prefs.colorblindMode, prefs.highContrast, prefs.colorIntensity, prefs.fontScale]);

  const update = useCallback((patch) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const t = useCallback((key) => translate(prefs.lang, key), [prefs.lang]);

  // Single instance for the whole app lifetime — see useEyeTracking.js and
  // the fix note there. Previously each page (Settings, Chat) called this
  // hook independently, so navigating between them re-ran
  // webgazer.begin() on an already-running instance on every visit.
  const eyeTracking = useEyeTracking(prefs.eyeTracking);

  const value = useMemo(
    () => ({ prefs, update, t, eyeTracking }),
    [prefs, update, t, eyeTracking]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
