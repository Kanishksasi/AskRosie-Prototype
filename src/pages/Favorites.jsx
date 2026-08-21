import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { ARTWORKS } from "../data/artworks.js";
import { Screen, Header, ArtworkArt } from "../components/ui.jsx";

export default function Favorites() {
  const { t, prefs } = useApp();
  const navigate = useNavigate();
  const saved = ARTWORKS.filter((a) => prefs.favorites.includes(a.id));

  return (
    <Screen>
      <Header dark />
      <div style={{ padding: "0 24px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 22, color: "var(--ar-teal)", margin: "8px 0 16px" }}>{t("favoritesTitle")}</h1>

        {saved.length === 0 ? (
          <p style={{ color: "#666", fontSize: 14 }}>{t("favoritesEmpty")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
            {saved.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/chat/${a.id}`)}
                style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}
              >
                <ArtworkArt artwork={a} height={140} radius={14} />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{a.artist}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
