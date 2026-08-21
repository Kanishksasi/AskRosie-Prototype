import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { t as translate } from "../data/strings.js";

const AppContext = createContext(null);

const STORAGE_KEY = "galleryguide:prefs:v1";

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
  gradeBand: null, // "k5" | "68" | "912" | null
  colorblindMode: "none", // none | protanopia | deuteranopia | tritanopia
  descriptiveMode: false,
  readAloud: false,
  highContrast: false,
  fontScale: 1,
  eyeTracking: false,
  favorites: [],
  onboarded: false,
};

export function AppProvider({ children }) {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...loadPrefs() }));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("ar-cb-protanopia", "ar-cb-deuteranopia", "ar-cb-tritanopia");
    if (prefs.colorblindMode !== "none") {
      root.classList.add(`ar-cb-${prefs.colorblindMode}`);
    }
    root.classList.toggle("ar-high-contrast", !!prefs.highContrast);
    root.style.setProperty("--ar-font-scale", String(prefs.fontScale || 1));
  }, [prefs.colorblindMode, prefs.highContrast, prefs.fontScale]);

  const update = useCallback((patch) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleFavorite = useCallback((artworkId) => {
    setPrefs((prev) => {
      const has = prev.favorites.includes(artworkId);
      return {
        ...prev,
        favorites: has ? prev.favorites.filter((id) => id !== artworkId) : [...prev.favorites, artworkId],
      };
    });
  }, []);

  const t = useCallback((key) => translate(prefs.lang, key), [prefs.lang]);

  const value = useMemo(
    () => ({ prefs, update, toggleFavorite, t }),
    [prefs, update, toggleFavorite, t]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
