import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import { buildSystemPrompt } from "./systemPrompt.js";

const app = express();
app.use(express.json({ limit: "12mb" }));

const PORT = process.env.PORT || 8787;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

function safeParseGroundedReply(raw) {
  try {
    const parsed = JSON.parse(raw);
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
  } catch {
    // Model didn't return valid JSON — fall back to showing the raw text
    // as a low-confidence answer rather than erroring the whole turn.
    return { answer: raw.trim(), confidence: "low", evidence: [], followUpQuestion: null, zoom: null };
  }
}

app.post("/api/chat", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set on the server" });
  }

  const { messages = [], image, gradeBand, descriptiveMode, lang, lookCloser, artworkContext } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }

  const systemPrompt = buildSystemPrompt({ gradeBand, descriptiveMode, lang, lookCloser, artworkContext });
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
    max_tokens: 650,
  };
  // JSON mode is reliable for text-only Groq calls; some vision models don't
  // support combining it with image content, so we lean on prompt
  // instructions + defensive parsing for those instead.
  if (!image) {
    body.response_format = { type: "json_object" };
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
