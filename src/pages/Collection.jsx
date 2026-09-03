import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { fetchArtworks } from "../data/artworks.js";
import { Screen, Header, ArtworkArt } from "../components/ui.jsx";

export default function Collection() {
  const { t, prefs } = useApp();
  const navigate = useNavigate();
  const artworks = fetchArtworks();

  const [artist, setArtist] = useState("");
  const [date, setDate] = useState("");
  const [medium, setMedium] = useState("");

  const filtered = useMemo(() => {
    const a = artist.trim().toLowerCase();
    const d = date.trim().toLowerCase();
    const m = medium.trim().toLowerCase();
    return artworks.filter(
      (art) =>
        (!a || art.artist.toLowerCase().includes(a)) &&
        (!d || art.decade.toLowerCase().includes(d) || String(art.year).includes(d)) &&
        (!m || art.medium.toLowerCase().includes(m))
    );
  }, [artworks, artist, date, medium]);

  return (
    <Screen>
      <Header dark />
      <div style={{ padding: "0 24px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "8px 0 16px" }}>{t("collectionTitle")}</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <FilterInput label={t("filterArtist")} value={artist} onChange={setArtist} placeholder={t("filterArtistPlaceholder")} />
          <FilterInput label={t("filterDate")} value={date} onChange={setDate} placeholder={t("filterDatePlaceholder")} />
          <FilterInput label={t("filterMedium")} value={medium} onChange={setMedium} placeholder={t("filterMediumPlaceholder")} />
        </div>

        <div
          style={{
            display: "grid",
            // Head-pointer users get one big target per row; everyone else
            // gets the responsive grid.
            gridTemplateColumns: prefs.eyeTracking ? "1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/chat/${a.id}`)}
              style={{
                background: "#fff",
                border: "1px solid var(--ar-line)",
                borderRadius: 16,
                textAlign: "left",
                cursor: "pointer",
                padding: 8,
                display: prefs.eyeTracking ? "flex" : "block",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: prefs.eyeTracking ? "0 0 120px" : "auto" }}>
                <ArtworkArt artwork={a} height={prefs.eyeTracking ? 90 : 140} radius={12} />
              </div>
              <div>
                <div style={{ marginTop: prefs.eyeTracking ? 0 : 8, fontSize: 13, fontWeight: 600, color: "var(--ar-ink)" }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {a.artist} · {a.year}
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && <p style={{ fontSize: 13, color: "#888" }}>{t("filterEmpty")}</p>}
      </div>
    </Screen>
  );
}

function FilterInput({ label, value, onChange, placeholder }) {
  return (
    <label style={{ fontSize: 12, color: "#555", display: "flex", flexDirection: "column", gap: 4 }}>
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid var(--ar-line)",
          fontSize: 13,
          background: "#fff",
          width: 150,
        }}
      />
    </label>
  );
}
