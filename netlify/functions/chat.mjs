// Netlify Function equivalent of the local Express /api/chat route
// (server/index.js) — this is what actually serves the deployed site,
// since Netlify only hosts the static `dist/` build and never runs
// `node server/index.js` as a persistent process. Both entry points share
// the exact same request/model/reply logic via ../../server/groqChat.js so
// they can't silently drift apart.
//
// Requires GROQ_API_KEY to be set as a Netlify environment variable (Site
// settings → Environment variables) — server/.env is local-only and never
// deployed. The `config.path` export below binds this function directly to
// /api/chat, so the frontend's existing fetch("/api/chat") calls work with
// no other changes.
import { runChat } from "../../server/groqChat.js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await runChat({ ...body, apiKey: process.env.GROQ_API_KEY });
  const status = result.ok ? 200 : result.status;
  const payload = result.ok ? result.reply : { error: result.error };

  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/chat" };
