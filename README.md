# Ask Rosie — Concept Prototype

A concept build presented directly to Crystal Bridges as a pitch for
enhancements to their existing Ask Rosie digital companion
(`askrosie.crystalbridges.org`). Because this is shared with them directly
rather than distributed publicly, it deliberately mirrors their name and
persona ("Rosie") and visual language, so it reads as a natural extension of
what they already have rather than a separate product. Per the accompanying
research brief (`crystal-bridges-ask-rosie-prototype-research.md`), it still
avoids their actual collection data, brand assets, and any
live/undocumented API — it's a self-contained build with its own small
hand-written demo dataset (fictional titles/artists), not a scrape or clone
of their real content. Every demo piece is paired with a real,
thematically-matching public-domain image (Art Institute of Chicago's open
API, CC0) as a visual stand-in, credited on-screen — see `src/data/artworks.js`.
`ArtworkArt` still falls back to a gradient placeholder automatically if an
image is ever missing or fails to load, so a broken/renamed file degrades
gracefully instead of showing a broken-image icon.

**If this ever moves beyond a direct pitch** (public repo, distributed
demo, shown to anyone outside Crystal Bridges), revisit the naming —
using their product name and mascot outside that direct context is a
different situation and should go back through the same IP considerations
in the research brief.

## What's inspired by (not copied from) the live product

- The general shape of a camera-first "point at art, ask questions" flow
- A similar visual rhythm during early UI exploration (color palette
  sampled from the public site while researching — see git history)
- The idea of a friendly onboarding + disclaimer + capture flow

Nothing here reproduces Crystal Bridges' actual UI code, copy, collection
data, or brand assets — the name and persona are the intentional exception,
per the note above.

## New/pitch features

- **Citation-first grounded answers**: every reply comes back as
  `{ answer, confidence, evidence, followUpQuestion, zoom }`. Rosie is only
  allowed to cite facts from each artwork's approved `sources` list
  (`src/data/artworks.js`); anything else is visual observation or flagged
  low-confidence rather than presented as fact.
- **"Look closer" mode**: a structured notice → evidence → interpretation →
  question walkthrough instead of free-form chat.
- **"Try recreating this"**: a hands-on creative prompt inviting visitors to
  riff on the piece themselves rather than just read about it.
- **Freshness metadata**: `onView`, `gallery`, `exhibition`, and
  `lastVerified` are shown on every artwork so nothing reads as a live,
  currently-accurate operational claim.
- **Staff review queue (demo)**: low-confidence questions are logged
  locally (`src/lib/reviewQueue.js`) and viewable at `/#/staff-review` —
  a stand-in for a real curator content-gap dashboard.
- **Grade-band / expertise-level mode** (K–5 / 6–8 / 9–12 for students,
  novice / casual / expert for adult visitors) that adjusts tone,
  vocabulary, and reply length.
- **Camera capture, upload, or browse-the-collection** as entry points,
  with free-text artist/date/medium search on the collection.
- **Zoom-to-detail**: Rosie's structured replies can include a `zoom`
  region, which the UI uses to animate the artwork image toward the detail
  she's describing.
- **Accessibility suite**: color-vision simulation filters (protanopia /
  deuteranopia / tritanopia), a descriptive mode for low-vision/blind
  visitors, read-aloud via browser speech synthesis, high contrast, and
  adjustable text size.
- **Experimental eye tracking**: opt-in, webcam-based gaze estimation
  (WebGazer.js) with a calibration flow — approximate, browser-based, not
  clinical-grade hardware tracking.
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

- `src/pages/*` — one file per screen: onboarding flow, grade/expertise
  select, capture, collection (browse/search), chat, settings, and the
  staff review demo
- `src/context/AppContext.jsx` — all user preferences (language, grade
  band, accessibility settings), persisted to `localStorage`
- `src/data/artworks.js` — the demo "MuseumContentAPI": swap
  `fetchArtworks()`/`getArtwork()` for a real collection API later; every
  screen goes through these functions, never the raw array
- `server/` — the only place the Groq key lives; `systemPrompt.js` builds
  the grounding rules and JSON output contract per-request from grade
  band, descriptive mode, look-closer/recreate mode, language, and the
  artwork's approved sources
- Camera captures and uploads are sent to the vision model directly with no
  approved sources (so answers about them stay low-confidence/observational
  by design); demo collection pieces are described to the model via their
  `sources` metadata

## Font note

Crystal Bridges' live site uses a licensed commercial typeface. This
prototype uses Inter (a free, visually similar grotesque sans) instead so
nothing here ships an unlicensed font file.
