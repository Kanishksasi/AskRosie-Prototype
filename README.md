# Gallery Guide — Concept Prototype

**Independent concept prototype — not an official Crystal Bridges product.**

An original demonstration inspired by the *visitor value* of Crystal
Bridges' AskRosie, built to be pitched back to Crystal Bridges as a set of
possible enhancements. Per the accompanying research brief
(`crystal-bridges-ask-rosie-prototype-research.md`), this deliberately does
**not** use Crystal Bridges' product name, mascot name ("Rosie"), branding,
collection data, or any live/undocumented API — it's a parallel,
self-contained build with its own working title ("Gallery Guide") and AI
persona ("Sage"), using a small hand-written demo dataset.

## What's inspired by (not copied from) the live product

- The general shape of a camera-first "point at art, ask questions" flow
- A similar visual rhythm during early UI exploration (color palette
  sampled from the public site while researching — see git history)
- The idea of a friendly onboarding + disclaimer + capture flow

Nothing here reproduces Crystal Bridges' actual UI code, copy, collection
data, or brand assets. If Crystal Bridges wants this prototyped against
their real content or branding, that requires their explicit sign-off —
see the outreach draft in the research brief.

## New/pitch features

- **Citation-first grounded answers**: every reply comes back as
  `{ answer, confidence, evidence, followUpQuestion, zoom }`. Sage is only
  allowed to cite facts from each artwork's approved `sources` list
  (`src/data/artworks.js`); anything else is visual observation or flagged
  low-confidence rather than presented as fact.
- **"Look closer" mode**: a structured notice → evidence → interpretation →
  question walkthrough instead of free-form chat.
- **Freshness metadata**: `onView`, `gallery`, `exhibition`, and
  `lastVerified` are shown on every artwork so nothing reads as a live,
  currently-accurate operational claim.
- **Staff review queue (demo)**: low-confidence questions are logged
  locally (`src/lib/reviewQueue.js`) and viewable at `/#/staff-review` —
  a stand-in for a real curator content-gap dashboard.
- **Grade-band mode** (K–5 / 6–8 / 9–12) that adjusts tone, vocabulary, and
  reply length.
- **Camera capture, upload, or browse-the-collection** as entry points,
  with artist/date/medium filtering on the collection.
- **Zoom-to-detail**: Sage's structured replies can include a `zoom`
  region, which the UI uses to animate the artwork image toward the detail
  she's describing.
- **Accessibility suite**: color-vision simulation filters (protanopia /
  deuteranopia / tritanopia), a descriptive mode for low-vision/blind
  visitors, read-aloud via browser speech synthesis, high contrast, and
  adjustable text size.
- **Experimental eye tracking**: opt-in, webcam-based gaze estimation
  (WebGazer.js) with a calibration flow — approximate, browser-based, not
  clinical-grade hardware tracking.
- **Save artworks for later** (heart icon → Favorites, persisted locally).
- **Multi-language** (English/Spanish), extensible via `src/data/strings.js`.

## Running it

```bash
npm install
cp server/.env.example server/.env
# then put your Groq key in server/.env as GROQ_API_KEY=...
npm run dev
```

This starts the Vite dev server (default `http://localhost:5173`) and a
small Express proxy on `:8787` that holds the Groq key server-side — the
key is never bundled into client code. Without a key, every screen still
works; the chat panel shows a friendly "add your API key" notice instead of
erroring silently.

## Architecture notes

- `src/pages/*` — one file per screen: onboarding flow, grade select,
  capture, collection (browse/filter), chat, favorites, settings, and the
  staff review demo
- `src/context/AppContext.jsx` — all user preferences (language, grade
  band, accessibility settings, favorites), persisted to `localStorage`
- `src/data/artworks.js` — the demo "MuseumContentAPI": swap
  `fetchArtworks()`/`getArtwork()` for a real collection API later; every
  screen goes through these functions, never the raw array
- `server/` — the only place the Groq key lives; `systemPrompt.js` builds
  the grounding rules and JSON output contract per-request from grade band,
  descriptive mode, look-closer mode, language, and the artwork's approved
  sources
- Camera captures and uploads are sent to the vision model directly with no
  approved sources (so answers about them stay low-confidence/observational
  by design); demo collection pieces are described to the model via their
  `sources` metadata

## Font note

Crystal Bridges' live site uses a licensed commercial typeface. This
prototype uses Inter (a free, visually similar grotesque sans) instead so
nothing here ships an unlicensed font file.
