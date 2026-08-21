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
    sessionStorage.setItem("galleryguide:capturedImage", dataUrl);
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
              border: "none",
              background: cameraState === "ready" ? "var(--ar-ink)" : "#999",
              color: "#fff",
              fontSize: 26,
              alignSelf: "center",
              cursor: cameraState === "ready" ? "pointer" : "not-allowed",
            }}
          >
            📷
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
              alignSelf: "center",
            }}
          >
            {t("whatCanICapture")}
          </button>

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
    </Screen>
  );
}
