// The whole "call Groq and shape a grounded reply" pipeline, shared between
// the local Express dev server (server/index.js) and the deployed Netlify
// Function (netlify/functions/chat.mjs) — one source of truth for request
// building, model selection, and reply parsing/fallbacks, so the two entry
// points can never silently drift apart.
import { buildSystemPrompt } from "./systemPrompt.js";

const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-120b";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b";

// Directional language in the model's own "Notice:" text, mapped to an
// approximate on-image position — used only when the model was asked for a
// zoom (Look closer mode, which is specifically about ONE visual detail)
// but didn't include one. LLM prose instructions are compliance-by-request,
// not a guarantee, so this is the backstop that keeps the zoom feature
// visibly doing something instead of silently doing nothing.
const DIRECTION_HINTS = [
  { re: /top[- ]?left|upper[- ]?left/i, x: 18, y: 18 },
  { re: /top[- ]?right|upper[- ]?right/i, x: 82, y: 18 },
  { re: /bottom[- ]?left|lower[- ]?left/i, x: 18, y: 82 },
  { re: /bottom[- ]?right|lower[- ]?right/i, x: 82, y: 82 },
  { re: /\btop\b|\bupper\b|\babove\b/i, x: 50, y: 15 },
  { re: /\bbottom\b|\blower\b|\bbelow\b/i, x: 50, y: 85 },
  { re: /\bleft\b/i, x: 18, y: 50 },
  { re: /\bright\b/i, x: 82, y: 50 },
];
// If no directional word matched either, rotate through a fixed set of
// off-center points rather than defaulting to the middle every time — the
// exact complaint this backstop exists to avoid.
const FALLBACK_POINTS = [
  { x: 30, y: 30 },
  { x: 70, y: 35 },
  { x: 40, y: 70 },
  { x: 65, y: 65 },
  { x: 25, y: 60 },
];
let fallbackPointIndex = 0;

function inferZoomFromText(text) {
  for (const { re, x, y } of DIRECTION_HINTS) {
    if (re.test(text)) return { x, y, scale: 1.7 };
  }
  const point = FALLBACK_POINTS[fallbackPointIndex % FALLBACK_POINTS.length];
  fallbackPointIndex += 1;
  return { x: point.x, y: point.y, scale: 1.6 };
}

function shapeReply(parsed, { lookCloser } = {}) {
  const answer = String(parsed.answer ?? "").trim();
  const zoom =
    parsed.zoom && typeof parsed.zoom.x === "number"
      ? {
          x: Math.min(100, Math.max(0, parsed.zoom.x)),
          y: Math.min(100, Math.max(0, parsed.zoom.y)),
          scale: Math.min(3, Math.max(1, parsed.zoom.scale || 1.6)),
        }
      : lookCloser
        ? inferZoomFromText(answer)
        : null;

  return {
    answer,
    confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "low",
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 3) : [],
    followUpQuestion: parsed.followUpQuestion ? String(parsed.followUpQuestion) : null,
    zoom,
  };
}

function safeParseGroundedReply(raw, opts) {
  try {
    return shapeReply(JSON.parse(raw), opts);
  } catch {
    // Not valid JSON on its own — the model may have wrapped it in prose
    // or markdown fences despite json_object mode. Try pulling out the
    // first {...} span before giving up entirely.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return shapeReply(JSON.parse(match[0]), opts);
      } catch {
        /* fall through to raw-text fallback below */
      }
    }
    // Truly not JSON — show the raw text as a low-confidence answer
    // rather than erroring the whole turn.
    return { answer: raw.trim(), confidence: "low", evidence: [], followUpQuestion: null, zoom: null };
  }
}

// Runs one full chat turn against Groq and returns a shaped, grounded
// reply. Returns { ok: true, reply } on success, or { ok: false, status,
// error } on any failure — callers map that straight onto their platform's
// response shape (Express res.status().json(), or a Netlify Response).
export async function runChat({
  apiKey,
  messages = [],
  image,
  depthLevel,
  depthLevelExtras,
  descriptiveMode,
  lang,
  lookCloser,
  recreate,
  artworkContext,
}) {
  if (!apiKey) {
    return { ok: false, status: 500, error: "GROQ_API_KEY is not set on the server" };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, status: 400, error: "messages is required" };
  }

  const systemPrompt = buildSystemPrompt({ depthLevel, depthLevelExtras, descriptiveMode, lang, lookCloser, recreate, artworkContext });
  const model = image ? VISION_MODEL : TEXT_MODEL;

  const formatted = messages.map((m, i) => {
    const isLastUser = image && i === messages.length - 1 && m.role === "user";
    if (isLastUser) {
      return {
        role: "user",
        content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: image } },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  const body = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...formatted],
    temperature: 0.6,
    // Reasoning-capable models (gpt-oss, qwen3.6) spend tokens on a hidden
    // reasoning pass before the visible JSON. With this app's longer
    // system prompt (grounding rules + full JSON schema), that pass can
    // run long enough to exhaust a tighter budget and leave zero tokens
    // for the actual answer, which Groq rejects as an empty/invalid
    // completion. 1600 leaves enough room for both on every model we use.
    max_tokens: 1600,
    // Forces the model's actual reply into `message.content` as strict
    // JSON. Reasoning-capable models (gpt-oss, qwen3.6) put their
    // chain-of-thought in a separate `message.reasoning` field instead —
    // without this, that reasoning can leak straight into the visible
    // answer. Verified working with qwen3.6-27b + an image_url content
    // block via direct API testing, despite some providers not supporting
    // the combination — don't remove this without re-verifying that.
    response_format: { type: "json_object" },
  };
  // gpt-oss models spend tokens on a hidden reasoning pass before the
  // visible JSON — at default effort that pass can consume the whole
  // max_tokens budget and leave nothing for the actual answer, producing an
  // empty/invalid completion. "low" keeps that pass short and reliable for
  // a task this constrained (grounded museum Q&A, not open-ended math/code).
  if (model.startsWith("openai/gpt-oss")) {
    body.reasoning_effort = "low";
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Groq API error:", response.status, detail);
      return { ok: false, status: 502, error: "Groq API request failed" };
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    const reply = safeParseGroundedReply(raw, { lookCloser: Boolean(lookCloser) });
    return { ok: true, reply };
  } catch (err) {
    console.error("Chat proxy error:", err);
    return { ok: false, status: 502, error: "Failed to reach Groq" };
  }
}
