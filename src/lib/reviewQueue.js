// Local, anonymous, in-browser log of visitor questions Rosie couldn't
// verify — demonstrates the "curator review queue" idea from the research
// brief without needing a real backend/database. Nothing here is sent
// anywhere; it lives only in this browser's localStorage.
const KEY = "askrosie:reviewQueue:v1";
const MAX_ENTRIES = 50;

export function logIfUnverified({ question, artworkTitle, confidence, lang }) {
  if (confidence !== "low") return;
  const entry = {
    question,
    artworkTitle: artworkTitle || "Untitled capture",
    confidence,
    lang,
    at: new Date().toISOString(),
  };
  const existing = readQueue();
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function readQueue() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(KEY);
}
