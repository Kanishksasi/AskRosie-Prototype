import { HashRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import ColorVisionFilters from "./components/ColorVisionFilters.jsx";
import BottomNav, { useShowBottomNav } from "./components/BottomNav.jsx";
import Landing from "./pages/Landing.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import GradeSelect from "./pages/GradeSelect.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Capture from "./pages/Capture.jsx";
import Collection from "./pages/Collection.jsx";
import Chat from "./pages/Chat.jsx";
import Favorites from "./pages/Favorites.jsx";
import Settings from "./pages/Settings.jsx";
import StaffReview from "./pages/StaffReview.jsx";

function AppShell() {
  const showNav = useShowBottomNav();
  return (
    <div className="gg-shell">
      <div className="gg-phone">
        <div
          className={`gg-scroll-area${showNav ? " gg-content-area" : ""}`}
          style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/grade" element={<GradeSelect />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/staff-review" element={<StaffReview />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ColorVisionFilters />
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AppProvider>
  );
}
