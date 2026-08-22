import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { getArtwork } from "../data/artworks.js";
import { askRosie } from "../lib/api.js";
import { logIfUnverified } from "../lib/reviewQueue.js";
import { useEyeTracking } from "../hooks/useEyeTracking.js";
import { getUiTier, TIER_CONFIG } from "../lib/uiTier.js";
import { Screen, Header, ArtworkArt } from "../components/ui.jsx";

const CONFIDENCE_COLOR = { high: "#2f7a45", medium: "var(--gg-olive)", low: "#a33b2b" };

export default function Chat() {
  const { id } = useParams();
  const { t, prefs } = useApp();
  const navigate = useNavigate();

  const isCustom = id === "custom-capture";
  const artwork = isCustom ? null : getArtwork(id);
  const capturedImage = isCustom ? sessionStorage.getItem("askrosie:capturedImage") : null;

  useEffect(() => {
    if (!isCustom && !artwork) navigate("/collection", { replace: true });
    if (isCustom && !capturedImage) navigate("/capture", { replace: true });
  }, [isCustom, artwork, capturedImage, navigate]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(null);
  const bottomRef = useRef(null);
  const startedRef = useRef(false);

  const { status: eyeStatus, gaze } = useEyeTracking(prefs.eyeTracking);

  const tier = getUiTier(prefs.depthLevel);
  const tierConfig = TIER_CONFIG[tier];

  const subjectLine = useMemo(() => {
    if (artwork) return `${artwork.title} (${artwork.year}) by ${artwork.artist} — ${artwork.medium}. ${artwork.blurb}`;
    return "a photo the visitor just captured or uploaded — there is no museum record for it, so treat it as an unidentified piece and only describe what's visible";
  }, [artwork]);

  useEffect(() => {
    if (startedRef.current) return;
    if (isCustom && !capturedImage) return;
    if (!isCustom && !artwork) return;
    startedRef.current = true;
    void sendTurn({ kickoff: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustom, artwork, capturedImage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!prefs.readAloud) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(last.data.answer);
    utter.lang = prefs.lang === "es" ? "es-ES" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [messages, prefs.readAloud, prefs.lang]);

  async function sendTurn({ userText, kickoff = false, lookCloser = false, recreate = false }) {
    setLoading(true);
    setError(null);

    const history = messages
      .filter((m) => !m.hidden)
      .map((m) => ({ role: m.role, content: m.role === "assistant" ? m.data.answer : m.text }));

    if (userText) {
      setMessages((prev) => [...prev, { role: "user", text: userText, hidden: false }]);
    }

    try {
      let prompt = userText;
      if (kickoff) {
        prompt = `The visitor just opened this artwork: ${subjectLine}. Greet them warmly in one or two short beats and invite them to ask something, then offer one interesting opening observation about the piece.`;
      } else if (lookCloser) {
        prompt = "Look closer with me at this piece.";
      } else if (recreate) {
        prompt = "I want to try recreating or riffing on this piece myself.";
      }

      const reply = await askRosie({
        messages: [...history, { role: "user", content: prompt }],
        image: isCustom ? capturedImage : null,
        depthLevel: prefs.depthLevel,
        descriptiveMode: prefs.descriptiveMode,
        lang: prefs.lang,
        lookCloser,
        recreate,
        artworkContext: artwork || null,
      });

      if (reply.zoom) {
        setZoom(reply.zoom);
        setTimeout(() => setZoom(null), 4200);
      }

      const mode = lookCloser ? "lookCloser" : recreate ? "recreate" : null;
      setMessages((prev) => [...prev, { role: "assistant", data: reply, mode, hidden: false }]);

      logIfUnverified({
        question: userText || (kickoff ? "[opening greeting]" : `[${mode}]`),
        artworkTitle: artwork?.title,
        confidence: reply.confidence,
        lang: prefs.lang,
      });
    } catch (e) {
      setError(e.status === 500 ? "config" : "network");
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void sendTurn({ userText: text });
  }

  const imageStyle = zoom
    ? { transform: `scale(${zoom.scale})`, transformOrigin: `${zoom.x}% ${zoom.y}%` }
    : {};

  return (
    <Screen>
      <Header dark />
      <div style={{ maxWidth: 560, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column", padding: "0 20px 20px" }}>
        <div style={{ borderRadius: 20, overflow: "hidden", position: "relative", marginBottom: 12 }}>
          <div style={{ transition: "transform 900ms cubic-bezier(0.22,1,0.36,1)", ...imageStyle }}>
            {isCustom && capturedImage ? (
              <img src={capturedImage} alt="Captured artwork" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
            ) : (
              <ArtworkArt artwork={artwork} height={220} radius={0} />
            )}
          </div>
          {zoom && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                right: 8,
                background: "rgba(20,20,20,0.7)",
                color: "#fff",
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 10,
              }}
            >
              {t("zoomHint")}
            </div>
          )}
        </div>

        {artwork && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{artwork.title}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {artwork.artist} · {artwork.year} · {artwork.medium}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              {artwork.onView ? t("onViewLabel") : t("notOnViewLabel")} · {t("galleryLabel")}: {artwork.gallery} ·{" "}
              {t("lastVerifiedLabel")}: {artwork.lastVerified}
            </div>
            {artwork.imageCredit && (
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{artwork.imageCredit}</div>
            )}
          </div>
        )}

        {prefs.eyeTracking && (
          <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
            👁 eye-tracking: {eyeStatus}
            {gaze && ` — (${Math.round(gaze.x)}, ${Math.round(gaze.y)})`}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 12 }}>
          {messages
            .filter((m) => !m.hidden)
            .map((m, i) =>
              m.role === "user" ? (
                <ChatBubble key={i} text={m.text} tierConfig={tierConfig} />
              ) : (
                <AssistantTurn key={i} data={m.data} mode={m.mode} t={t} tierConfig={tierConfig} />
              )
            )}
          {loading && <ChatBubble text={t("thinking")} muted />}
          {error && <ApiError kind={error} t={t} />}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => void sendTurn({ lookCloser: true })}
            disabled={loading}
            title={t("lookCloserHint")}
            style={{
              fontSize: tierConfig.actionFontSize,
              padding: tierConfig.actionPadding,
              borderRadius: 999,
              border: "1px solid var(--ar-teal)",
              background: "#fff",
              color: "var(--ar-teal)",
              fontWeight: tier === "playful" ? 600 : 400,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            🔍 {t("lookCloser")}
          </button>
          <button
            onClick={() => void sendTurn({ recreate: true })}
            disabled={loading}
            title={t("recreateHint")}
            style={{
              fontSize: tierConfig.actionFontSize,
              padding: tierConfig.actionPadding,
              borderRadius: 999,
              border: "1px solid var(--gg-tert-gold)",
              background: "#fff",
              color: "#8a6218",
              fontWeight: tier === "playful" ? 600 : 400,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            🎨 {t("recreate")}
          </button>
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 999,
              border: "1px solid var(--ar-line)",
              fontSize: tierConfig.inputFontSize,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 20px",
              borderRadius: 999,
              border: "none",
              background: "var(--ar-ink)",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {t("send")}
          </button>
        </form>
      </div>
    </Screen>
  );
}

function ChatBubble({ text, muted, tierConfig }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: tierConfig?.bubbleRadius ?? 16,
          fontSize: tierConfig?.answerFontSize ?? 14,
          lineHeight: tierConfig?.answerLineHeight ?? 1.5,
          background: "var(--ar-mist)",
          color: "var(--ar-ink)",
          opacity: muted ? 0.6 : 1,
        }}
      >
        {text}
      </div>
    </div>
  );
}

const MODE_ACCENT = { lookCloser: "var(--ar-teal)", recreate: "var(--gg-tert-gold)" };

function AssistantTurn({ data, mode, t, tierConfig }) {
  const accent = MODE_ACCENT[mode];
  const [sourcesOpen, setSourcesOpen] = useState(tierConfig.sourcesDefaultOpen);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <div
        style={{
          maxWidth: "88%",
          padding: "12px 14px",
          borderRadius: tierConfig.bubbleRadius,
          fontSize: tierConfig.answerFontSize,
          lineHeight: tierConfig.answerLineHeight,
          background: accent ? "#fff" : "var(--ar-mist)",
          border: accent ? `1px solid ${accent}` : "none",
          color: "var(--ar-ink)",
          whiteSpace: "pre-line",
        }}
      >
        {data.answer}
      </div>

      {tierConfig.confidenceVisible && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: CONFIDENCE_COLOR[data.confidence] }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: CONFIDENCE_COLOR[data.confidence] }} />
          {t(`confidence${data.confidence[0].toUpperCase()}${data.confidence.slice(1)}`)}
        </div>
      )}

      {data.evidence?.length > 0 && !tierConfig.sourcesDefaultOpen && (
        <button
          onClick={() => setSourcesOpen((v) => !v)}
          style={{
            fontSize: 13,
            color: "var(--ar-teal)",
            background: "none",
            border: "none",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {sourcesOpen ? t("sourcesToggleHide") : t("sourcesToggleShow")}
        </button>
      )}

      {data.evidence?.length > 0 && sourcesOpen && (
        <div style={{ maxWidth: "88%", background: "#fbfaf6", border: "1px solid var(--ar-line)", borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#888", marginBottom: 4 }}>
            {t("sourcesLabel")}
          </div>
          {data.evidence.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: "#444", marginBottom: 2 }}>
              <strong>{e.sourceLabel}:</strong> {e.claim}
            </div>
          ))}
        </div>
      )}

      {data.followUpQuestion && (
        <div style={{ maxWidth: "88%", fontSize: tierConfig.actionFontSize, color: "var(--ar-teal)", fontStyle: "italic" }}>
          {t("followUpLabel")} {data.followUpQuestion}
        </div>
      )}
    </div>
  );
}

function ApiError({ kind, t }) {
  return (
    <div style={{ background: "#fdecea", border: "1px solid var(--ar-danger)", borderRadius: 12, padding: 12, fontSize: 13 }}>
      {kind === "config" ? (
        <>
          <strong>{t("apiKeyMissingTitle")}</strong>
          <p style={{ margin: "6px 0 0" }}>{t("apiKeyMissingBody")}</p>
        </>
      ) : (
        <p style={{ margin: 0 }}>Something went wrong reaching Rosie. Please try again.</p>
      )}
    </div>
  );
}
