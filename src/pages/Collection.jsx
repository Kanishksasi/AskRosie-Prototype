import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { fetchArtworks, getFilterOptions } from "../data/artworks.js";
import { Screen, Header, ArtworkArt } from "../components/ui.jsx";

export default function Collection() {
  const { t } = useApp();
  const navigate = useNavigate();
  const artworks = fetchArtworks();
  const { artists, decades, mediums } = getFilterOptions();

  const [artist, setArtist] = useState("all");
  const [decade, setDecade] = useState("all");
  const [medium, setMedium] = useState("all");

  const filtered = useMemo(
    () =>
      artworks.filter(
        (a) =>
          (artist === "all" || a.artist === artist) &&
          (decade === "all" || a.decade === decade) &&
          (medium === "all" || a.medium === medium)
      ),
    [artworks, artist, decade, medium]
  );

  return (
    <Screen>
      <Header dark />
      <div style={{ padding: "0 24px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "8px 0 16px" }}>{t("collectionTitle")}</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <FilterSelect label={t("filterArtist")} value={artist} onChange={setArtist} options={artists} allLabel={t("filterAll")} />
          <FilterSelect label={t("filterDate")} value={decade} onChange={setDecade} options={decades} allLabel={t("filterAll")} />
          <FilterSelect label={t("filterMedium")} value={medium} onChange={setMedium} options={mediums} allLabel={t("filterAll")} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/chat/${a.id}`)}
              style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}
            >
              <ArtworkArt artwork={a} height={140} radius={14} />
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--ar-ink)" }}>{a.title}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {a.artist} · {a.year}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <label style={{ fontSize: 12, color: "#555", display: "flex", flexDirection: "column", gap: 4 }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid var(--ar-line)",
          fontSize: 13,
          background: "#fff",
        }}
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
