// Maps the visitor's grade/expertise selection to a UI complexity tier.
// The AI's tone already adapts per-level via server/systemPrompt.js — this
// drives the *visual* side of that same adaptation so the difference is
// visible in the interface itself, not just in what Rosie says.
export function getUiTier(depthLevel) {
  if (depthLevel === "k5") return "playful";
  if (depthLevel === "68") return "middle";
  if (depthLevel === "912" || depthLevel === "expert" || depthLevel === "teacher") return "detailed";
  return "standard"; // novice, casual, or no selection
}

export const TIER_CONFIG = {
  playful: {
    answerFontSize: 17,
    answerLineHeight: 1.75,
    bubbleRadius: 22,
    actionFontSize: 14,
    actionPadding: "10px 18px",
    inputFontSize: 16,
    sourcesDefaultOpen: false,
    confidenceVisible: false,
  },
  // Grades 6-8: bigger and friendlier than the generic adult layout, but
  // — unlike K-5 — middle schoolers benefit from seeing *why* Rosie said
  // something (it's a critical-thinking skill the grade68 tone in
  // systemPrompt.js explicitly leans into), so sources and confidence stay
  // visible by default instead of tucked behind a toggle.
  middle: {
    answerFontSize: 15.5,
    answerLineHeight: 1.65,
    bubbleRadius: 19,
    actionFontSize: 13,
    actionPadding: "8px 16px",
    inputFontSize: 15,
    sourcesDefaultOpen: true,
    confidenceVisible: true,
  },
  standard: {
    answerFontSize: 14,
    answerLineHeight: 1.55,
    bubbleRadius: 16,
    actionFontSize: 12,
    actionPadding: "6px 14px",
    inputFontSize: 14,
    sourcesDefaultOpen: true,
    confidenceVisible: true,
  },
  detailed: {
    answerFontSize: 13.5,
    answerLineHeight: 1.5,
    bubbleRadius: 12,
    actionFontSize: 12,
    actionPadding: "6px 14px",
    inputFontSize: 14,
    sourcesDefaultOpen: true,
    confidenceVisible: true,
  },
};
