import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { runChat } from "./groqChat.js";

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

// This is a thin platform adapter — the actual chat/model/reply-shaping
// logic lives in groqChat.js so it's identical on Netlify (see
// netlify/functions/chat.mjs), not a fork that can drift out of sync.
app.post("/api/chat", async (req, res) => {
  const result = await runChat({ ...(req.body || {}), apiKey: GROQ_API_KEY });
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.json(result.reply);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(GROQ_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Ask Rosie API proxy listening on http://localhost:${PORT}`);
  if (!GROQ_API_KEY) {
    console.warn("⚠️  GROQ_API_KEY is not set — add it to server/.env to enable chat.");
  }
});
