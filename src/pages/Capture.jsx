import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Screen, Header, PrimaryButton, Modal } from "../components/ui.jsx";

export default function Capture() {
  const { t } = useApp();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraState, setCameraState] = useState("idle"); // idle | ready | denied
  const [infoOpen, setInfoOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraState("ready");
      } catch {
        if (!cancelled) setCameraState("denied");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function goToCustomCapture(dataUrl) {
    sessionStorage.setItem("askrosie:capturedImage", dataUrl);
    navigate("/chat/custom-capture");
  }

  function handleSnap() {
    const video = videoRef.current;
    if (!video || cameraState !== "ready") return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    goToCustomCapture(canvas.toDataURL("image/jpeg", 0.85));
  }

  function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => goToCustomCapture(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <Screen>
      <Header dark />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 24,
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h1 style={{ fontSize: 20, textAlign: "center", color: "var(--ar-teal)", marginTop: 24 }}>
          {t("captureTitle")}
        </h1>

        <div
          style={{
            flex: 1,
            borderRadius: 20,
            overflow: "hidden",
            background: "#111",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 220,
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: cameraState === "ready" ? "block" : "none",
            }}
          />
          {cameraState === "denied" && (
            <p style={{ color: "#fff", fontSize: 13, padding: 24, textAlign: "center" }}>{t("cameraDenied")}</p>
          )}
          {cameraState === "idle" && <p style={{ color: "#fff", fontSize: 13 }}>…</p>}

          {cameraState === "ready" && (
            <>
              <FrameGuideCorner vertical="top" horizontal="left" />
              <FrameGuideCorner vertical="top" horizontal="right" />
              <FrameGuideCorner vertical="bottom" horizontal="left" />
              <FrameGuideCorner vertical="bottom" horizontal="right" />
              <span
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 11,
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {t("captureFrameHint")}
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <button
            onClick={handleSnap}
            disabled={cameraState !== "ready"}
            aria-label={t("startScan")}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: `4px solid ${cameraState === "ready" ? "#fff" : "#ccc"}`,
              background: cameraState === "ready" ? "var(--ar-ink)" : "#999",
              alignSelf: "center",
              cursor: cameraState === "ready" ? "pointer" : "not-allowed",
              boxShadow: "0 0 0 2px var(--ar-ink)",
            }}
          />

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setTipsOpen(true)}
              style={{
                background: "none",
                border: "none",
                textDecoration: "underline",
                fontSize: 13,
                color: "var(--ar-ink)",
                cursor: "pointer",
              }}
            >
              {t("captureTipsLabel")}
            </button>
            <button
              onClick={() => setInfoOpen(true)}
              style={{
                background: "none",
                border: "none",
                textDecoration: "underline",
                fontSize: 13,
                color: "var(--ar-ink)",
                cursor: "pointer",
              }}
            >
              {t("whatCanICapture")}
            </button>
          </div>

          <div style={{ borderTop: "1px solid var(--ar-line)", paddingTop: 16, display: "flex", gap: 10 }}>
            <PrimaryButton onClick={() => fileInputRef.current?.click()} style={{ background: "#fff", color: "var(--ar-ink)", border: "1px solid var(--ar-line)" }}>
              {t("uploadPhoto")}
            </PrimaryButton>
            <PrimaryButton onClick={() => navigate("/collection")}>{t("browseCollection")}</PrimaryButton>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title={t("captureInfoTitle")}>
        {t("captureInfoBody")}
      </Modal>

      <Modal open={tipsOpen} onClose={() => setTipsOpen(false)} title={t("captureTipsTitle")}>
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {["captureTip1", "captureTip2", "captureTip3", "captureTip4", "captureTip5"].map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </Modal>
    </Screen>
  );
}

// Corner-bracket framing guide, shown over the live viewfinder once the
// camera is ready — the same "align your subject in this box" convention
// as a QR/barcode scanner, here nudging toward the composition tips above
// (fill the frame, shoot straight on) without blocking the shutter.
function FrameGuideCorner({ vertical, horizontal }) {
  const thickness = 3;
  const edgeColor = "rgba(255,255,255,0.85)";
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        [vertical]: "10%",
        [horizontal]: "10%",
        width: 28,
        height: 28,
        borderTop: vertical === "top" ? `${thickness}px solid ${edgeColor}` : "none",
        borderBottom: vertical === "bottom" ? `${thickness}px solid ${edgeColor}` : "none",
        borderLeft: horizontal === "left" ? `${thickness}px solid ${edgeColor}` : "none",
        borderRight: horizontal === "right" ? `${thickness}px solid ${edgeColor}` : "none",
        borderRadius: 4,
        pointerEvents: "none",
      }}
    />
  );
}
