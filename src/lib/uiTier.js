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

// Confidence + sources used to default open for middle/standard/detailed
// tiers, on the theory that older visitors benefit from seeing the
// grounding by default. In practice that put two extra blocks under every
// single reply — real clutter. Now every tier collapses them the same way,
// behind one small toggle on the answer (see AssistantTurn in Chat.jsx);
// the underlying transparency is unchanged, just opt-in instead of forced.
export const TIER_CONFIG = {
  playful: {
    answerFontSize: 17,
    answerLineHeight: 1.75,
    bubbleRadius: 22,
    actionFontSize: 14,
    actionPadding: "10px 18px",
    inputFontSize: 16,
  },
  middle: {
    answerFontSize: 15.5,
    answerLineHeight: 1.65,
    bubbleRadius: 19,
    actionFontSize: 13,
    actionPadding: "8px 16px",
    inputFontSize: 15,
  },
  standard: {
    answerFontSize: 14,
    answerLineHeight: 1.55,
    bubbleRadius: 16,
    actionFontSize: 12,
    actionPadding: "6px 14px",
    inputFontSize: 14,
  },
  detailed: {
    answerFontSize: 13.5,
    answerLineHeight: 1.5,
    bubbleRadius: 12,
    actionFontSize: 12,
    actionPadding: "6px 14px",
    inputFontSize: 14,
  },
};
