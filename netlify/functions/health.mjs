// Quick way to confirm the deployed GROQ_API_KEY env var is actually set,
// without needing to open the chat and trigger a real Groq call — visit
// /api/health on the deployed site.
export default async () =>
  new Response(JSON.stringify({ ok: true, hasKey: Boolean(process.env.GROQ_API_KEY) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

export const config = { path: "/api/health" };
