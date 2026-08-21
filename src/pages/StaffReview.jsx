import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { readQueue, clearQueue } from "../lib/reviewQueue.js";
import { Screen, Header, PrimaryButton } from "../components/ui.jsx";

// Demo of the "curator review queue" idea from the research brief: a place
// staff could see what visitor questions the AI couldn't verify, so they
// know what museum content to add next. Entirely local/in-browser here —
// a real version would send these (anonymously) to a staff-facing backend.
export default function StaffReview() {
  const { t } = useApp();
  const [entries, setEntries] = useState(() => readQueue());

  return (
    <Screen>
      <Header dark />
      <div style={{ padding: "0 24px 60px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "8px 0 4px" }}>{t("staffDashboardTitle")}</h1>
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 20px" }}>{t("staffDashboardBody")}</p>

        {entries.length === 0 ? (
          <p style={{ fontSize: 13, color: "#888" }}>{t("staffDashboardEmpty")}</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {entries.map((e, i) => (
                <div key={i} style={{ border: "1px solid var(--ar-line)", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.question}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    {e.artworkTitle} · {new Date(e.at).toLocaleString()} · {e.lang}
                  </div>
                </div>
              ))}
            </div>
            <PrimaryButton
              onClick={() => {
                clearQueue();
                setEntries([]);
              }}
              style={{ background: "#fff", color: "var(--ar-danger)", border: "1px solid var(--ar-danger)" }}
            >
              {t("staffClear")}
            </PrimaryButton>
          </>
        )}
      </div>
    </Screen>
  );
}
