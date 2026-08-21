// Thin client for the local proxy server (server/index.js), which holds the
// Groq API key server-side so it never ships in the browser bundle.
//
// Returns the grounded-answer contract: { answer, confidence, evidence,
// followUpQuestion, zoom }. See server/systemPrompt.js for the schema Sage
// is instructed to return.
export async function askSage({ messages, image, gradeBand, descriptiveMode, lang, lookCloser, artworkContext }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, image, gradeBand, descriptiveMode, lang, lookCloser, artworkContext }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
