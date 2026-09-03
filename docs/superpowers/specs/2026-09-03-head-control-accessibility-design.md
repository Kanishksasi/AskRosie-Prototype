# Head-control accessibility: scroll, voice input, blink reliability

**Status:** approved for implementation
**Date:** 2026-09-03

## Problem

The head-pointer accessibility feature (Apple Head Pointer clone: head moves a
pointer, blink both eyes to click) only supports one action — a synthetic
`.click()` on whatever DOM element is under the pointer. A visitor who can only
move their head therefore cannot:

- **Scroll** — `.click()` does nothing for scrolling; the pointer is hard-clamped
  to the `.gg-phone` card so it can't push past an edge. Content below the fold
  (chat history, collection grid, settings, the lower grade-select options) is
  unreachable.
- **Enter text** — `.click()` on an `<input>` produces no text and there is no
  on-screen keyboard anywhere. The Chat composer is dead to a head-only visitor.
- **Click accurately** — a blink shifts the eye-corner landmarks that head-center
  is computed from, so the pointer lurches (usually downward) at the exact moment
  of the click. Clicks land below where the user aimed. Involuntary blinks
  (~15–20/min) each fire a click.

Testing also surfaced: the grade / reading-level screen forces one shared choice
across three groups (Student band / Adult level / Teacher), and its lower options
can't be reached by head at all.

## Goals

A head-only visitor can complete the full flow: navigate → scroll → pick a
reading level → open an artwork → ask a typed/spoken question → read the answer.
Every fix also has to work for ordinary touch/mouse users (no regressions).

## Non-goals

- Clinical-grade tracking. This stays an approximate webcam estimate.
- Enabling head-tracking hands-free (still needs one initial tap — staff-assisted
  kiosk assumption).
- Driving the OS file picker ("Upload photo") by head — shutter + browse are the
  head paths.

---

## Design

### 1. Blink → click reliability  (`hooks/useEyeTracking.js`, `components/HeadPointer.jsx`)

**Pointer freeze during blink.** Track a "blink in progress" state from a low
pre-threshold (~0.30) on the `eyeBlinkLeft` / `eyeBlinkRight` blendshapes — below
the 0.55 click threshold. While a blink is in progress, and for ~300 ms after the
eyes reopen, stop calling `setGaze` — hold the last good smoothed point. This is
what stops the "pointer moves down when I blink" lurch.

**Click at the pre-blink location.** Keep a small ring buffer (~6 frames) of
smoothed points. When a click fires, use the point from ~200 ms before blink
onset, exposed as `blinkPoint {x,y}`. `HeadPointer` calls `elementFromPoint` /
`click()` at `blinkPoint`, not the live (frozen-but-possibly-stale) `gaze`.

**Deliberate vs reflex classification.** Move the click trigger from the closing
edge to the **opening edge**, so the closure duration is known:

| eyes closed for | action |
|---|---|
| < 280 ms | ignored (reflex blink) |
| 280–900 ms | click at `blinkPoint` |
| 900–1200 ms | ignored (dead band, disambiguation) |
| ≥ 1200 ms | `recenter()` + "Re-centered" toast |

`recenter` becomes the one hands-free maintenance gesture. Constants live next to
the existing `BLINK_THRESHOLD` / `BLINK_COOLDOWN_MS` with the same "one knob to
tune" comment style.

**Charging ring.** While the eyes are closed past 280 ms, a ring grows around the
pointer dot. The hook exposes a new `blinkChargeMs` value (0 when eyes open, else
ms-closed), and `HeadPointer` maps it to a CSS ring scale. Past 1200 ms it
switches to the recenter style. Gives feedback during the closure instead of a
silent wait for the open edge.

**Target highlight.** On each `gaze` update (throttled to ~every 80 ms),
`elementFromPoint` and, if the result is interactive
(`button, a, [role="button"], input, label, select`), add a halo outline class to
it; remove it when the pointer leaves. So the user sees what a blink will hit.

**Tracking-loss feedback.** If `result.faceLandmarks` is empty for ~1 s: set a
`status` of `"lost"`, fade the pointer to 40 % opacity, and show a small centered
"Move back into view" hint. Auto-recovers (`status` back to `"ready"`) when a face
returns. Currently the pointer just silently freezes.

### 2. Dwell-to-scroll  (`hooks/useDwellScroll.js`, `components/DwellScrollHint.jsx`, `App.jsx`)

New hook, driven by `gaze` + `prefs.eyeTracking`. Not part of `useEyeTracking` —
it needs no camera internals, only the pointer position.

- **Scroll target:** `elementFromPoint(gaze)` then walk ancestors to the nearest
  one that actually scrolls (`scrollHeight > clientHeight` and computed
  `overflow-y` is `auto`/`scroll`). Falls back to `document.scrollingElement`.
  Handles all three real cases: mobile window-scroll, desktop `.gg-scroll-area`,
  and Chat's inner `overflow-y:auto` message list, plus tall modal bodies.
- **Zones:** top 15 % and bottom 15 % of the target's client rect. The bottom
  zone is inset by `var(--gg-navh)` when the BottomNav is present so it doesn't
  sit under the nav links.
- **Dwell:** pointer stays within the same zone (and within ~40 px of where it
  entered) for ≥ 400 ms → start an rAF scroll loop. Speed ramps from ~2 px/frame
  to ~14 px/frame over ~1.5 s. Leaving the zone stops it immediately.
- **Blink suppression:** while a dwell-scroll loop is running, `HeadPointer`
  ignores `blinkSignal` (a blink at a screen edge almost never means "click the
  edge").
- **Affordance:** `DwellScrollHint` renders subtle chevrons / gradient at the top
  and bottom edges of the `.gg-phone` frame whenever `prefs.eyeTracking` is on,
  brightening while a scroll loop is active. Mounted in `AppShell` beside
  `HeadPointer`.

### 3. Voice input + keyboard fallback  (`hooks/useSpeechInput.js`, `components/OnScreenKeyboard.jsx`, `pages/Chat.jsx`)

**`useSpeechInput({ lang })`** wraps `window.SpeechRecognition ||
window.webkitSpeechRecognition`:

- `supported` boolean (false on Firefox).
- `recognition.lang = lang === "es" ? "es-ES" : "en-US"`, `interimResults = true`,
  `continuous = false` (so it auto-stops on silence). Hard 15 s safety timeout.
- `start()` / `stop()`, `listening` state, accumulated `transcript`, `error`
  (`not-allowed` | `no-speech` | `network` | `audio-capture`).

**Chat composer** ([Chat.jsx:245-273]):

- Mic button left of the text input. Shown whenever `supported`; independent of
  `prefs.eyeTracking` (voice is useful for everyone).
- Blink/tap the mic → `start()`. Button pulses; placeholder → "Listening…";
  interim transcript streams live into the `input` value. On final result the
  text stays in `input`; the user then blinks **Send**.
- When `prefs.eyeTracking` is on, a click anywhere on the input field also calls
  `start()` (the field can't be typed into by head, so the whole thing is the
  voice trigger; the mic icon signals this).
- `window.speechSynthesis.cancel()` on `start()` so read-aloud output isn't
  transcribed.
- Mic permission is requested early — on first Chat mount, or when
  `prefs.eyeTracking` flips on in Settings — so the prompt isn't stranded in
  front of a head-only user.

**`OnScreenKeyboard`** — compact panel above the composer:

- QWERTY letter rows + a row with `space`, `⌫`, `?`, `.`, `Done`.
- Each key is a real `<button>`, min 40 px target, `onClick` appends / backspaces
  `input`. Works by pointer+blink and by touch.
- Auto-opens when speech `error === "not-allowed"` or `!supported`. Otherwise
  toggled by a small "abc" button next to the mic.
- Chat only (the sole visitor-facing free-text field).

### 4. Grade select — no change

> **Superseded.** An earlier revision of this spec made the three grade groups
> independently selectable with a primary/context model. That was reverted (see
> commit "Revert grade select to a single choice"): the screen stays one pick
> total across all groups, sharing a single `prefs.depthLevel`, exactly as it was
> before this work. No `levelSelections`, no `depthLevelExtras`.

### 5. Slider steppers  (`pages/Settings.jsx`)

`–` / `+` buttons flanking the `colorIntensity` and `fontScale` range inputs,
stepping by the input's `step`. Always shown (useful for touch too), blink-sized.

### 6. Head-control help  (`components/HeadControlHelp.jsx`, `pages/Settings.jsx`)

One card: *look to move · hold your eyes closed briefly to click · rest the
pointer at the top or bottom edge to scroll · close your eyes for a second to
re-center · blink the mic button to speak.* Shown once right after calibration
(`onDone`), re-openable from a link in the eye-tracking Settings field.

### 7. Strings  (`data/strings.js`)

All new UI copy added to both `en` and `es`: listening / mic hint / keyboard
toggle / scroll hint / "move back into view" / re-centered toast / help card /
"Primary" + "also selected" / stepper aria-labels.

---

## Files

**New**
- `src/hooks/useDwellScroll.js`
- `src/hooks/useSpeechInput.js`
- `src/components/DwellScrollHint.jsx`
- `src/components/OnScreenKeyboard.jsx`
- `src/components/HeadControlHelp.jsx`

**Modified**
- `src/hooks/useEyeTracking.js` — blink freeze, `blinkPoint`, duration classes,
  charge value, `"lost"` status
- `src/components/HeadPointer.jsx` — click at `blinkPoint`, charging ring, target
  halo, blink suppression during scroll, lost-state fade
- `src/App.jsx` — mount `useDwellScroll` + `DwellScrollHint`
- `src/pages/Chat.jsx` — mic button, interim transcript, keyboard fallback
- `src/pages/GradeSelect.jsx` — independent groups, primary marker
- `src/pages/Settings.jsx` — slider steppers, help-card link, grouped grade write
- `src/context/AppContext.jsx` — `levelSelections` in prefs + defaults
- `src/lib/api.js` — pass `depthLevelExtras`
- `server/systemPrompt.js` — `LEVEL_DESCRIPTION`, extras line
- `server/groqChat.js` — add `depthLevelExtras` to `runChat`'s destructuring and
  the `buildSystemPrompt` call (both `server/index.js` and
  `netlify/functions/chat.mjs` already spread the whole body into `runChat`, so
  no change there)
- `src/data/strings.js` — new bilingual strings
- `src/styles/tokens.css` — charging ring, target halo, dwell chevrons, keyboard,
  mic pulse, lost-state styles

## Testing

Local only. `npm run dev`, browser preview:

- Build compiles, no console errors on every route.
- Keyboard types into the Chat field; `⌫` and `Done` work.
- Mic button feature-detects (visible in Chromium preview, calls `start()`).
- Dwell math: simulate `gaze` at top/bottom of a scroll container, confirm the
  loop starts after the delay and stops on exit.
- Slider steppers change the value and the live effect.
- Grade screen: pick in two groups, confirm both stay highlighted, primary marked,
  `depthLevelExtras` populated in the `/api/chat` request body.
- Layout intact at mobile width and ≥700 px.

Webcam / blink-timing / live speech recognition are verified by the user locally.
**No `git push`** — local commits only.

## Rollout

Single local branch, incremental commits per numbered section. User tests with a
real webcam between sections.
