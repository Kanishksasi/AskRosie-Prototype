import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import fetch from "node-fetch";
import { buildSystemPrompt } from "./systemPrompt.js";

// `dotenv/config`'s auto-loader only reads .env from process.cwd(), which is
// the project root when this runs via `npm run dev` — not this file's own
// directory. Load server/.env explicitly so it works regardless of cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json({ limit: "12mb" }));

// Deliberately API_PORT, not PORT: this runs alongside the Vite frontend
// via `concurrently` and shares its environment. If a dev-server manager
// reassigns PORT to dodge a conflict on the frontend's port, this process
// must not pick that up too and collide with Vite on the new port.
const PORT = process.env.API_PORT || 8787;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-120b";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b";

function shapeReply(parsed) {
  return {
    answer: String(parsed.answer ?? "").trim(),
    confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "low",
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 3) : [],
    followUpQuestion: parsed.followUpQuestion ? String(parsed.followUpQuestion) : null,
    zoom:
      parsed.zoom && typeof parsed.zoom.x === "number"
        ? {
            x: Math.min(100, Math.max(0, parsed.zoom.x)),
            y: Math.min(100, Math.max(0, parsed.zoom.y)),
            scale: Math.min(3, Math.max(1, parsed.zoom.scale || 1.6)),
          }
        : null,
  };
}

function safeParseGroundedReply(raw) {
  try {
    return shapeReply(JSON.parse(raw));
  } catch {
    // Not valid JSON on its own — the model may have wrapped it in prose
    // or markdown fences despite json_object mode. Try pulling out the
    // first {...} span before giving up entirely.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return shapeReply(JSON.parse(match[0]));
      } catch {
        /* fall through to raw-text fallback below */
      }
    }
    // Truly not JSON — show the raw text as a low-confidence answer
    // rather than erroring the whole turn.
    return { answer: raw.trim(), confidence: "low", evidence: [], followUpQuestion: null, zoom: null };
  }
}

app.post("/api/chat", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set on the server" });
  }

  const { messages = [], image, depthLevel, descriptiveMode, lang, lookCloser, recreate, artworkContext } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }

  const systemPrompt = buildSystemPrompt({ depthLevel, descriptiveMode, lang, lookCloser, recreate, artworkContext });
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
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Groq API error:", response.status, detail);
      return res.status(502).json({ error: "Groq API request failed" });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    const reply = safeParseGroundedReply(raw);
    res.json(reply);
  } catch (err) {
    console.error("Chat proxy error:", err);
    res.status(502).json({ error: "Failed to reach Groq" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(GROQ_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Gallery Guide API proxy listening on http://localhost:${PORT}`);
  if (!GROQ_API_KEY) {
    console.warn("⚠️  GROQ_API_KEY is not set — add it to server/.env to enable chat.");
  }
});
