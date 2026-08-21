# Crystal Bridges “Ask Rosie” — Public Research & Prototype Brief

**Prepared:** August 21, 2026  
**Purpose:** A research-backed brief for building a **non-production, clearly labeled prototype** that demonstrates potential enhancements to Crystal Bridges’ Ask Rosie digital companion.

> **Important boundary:** This document covers publicly observable information only. It does **not** establish that Ask Rosie has a public API, nor does it authorize copying proprietary code, branding, content, data, or user flows. Build an original demonstration using mock/sample data and a separate AI provider or local backend. Seek written permission before using Crystal Bridges’ marks, collection data at scale, or any internal integration.

---

## 1. What is publicly confirmed

Crystal Bridges publicly positions **Ask Rosie** as a “digital companion” that answers questions about art inside the galleries. The companion is publicly available at `https://askrosie.crystalbridges.org/en` and opens with the message:

> “Hi, I am Rosie! Let’s talk about art. Ask questions about anything you’re curious about, find stories together.”

The public-facing copy indicates an art-conversation/discovery experience, not a general-purpose visitor-services assistant.

### Publicly confirmed product scope

- Conversational companion centered on art.
- Intended for questions and exploration of stories.
- Linked prominently from the Crystal Bridges main website as “Ask Rosie.”
- Accessible through a dedicated subdomain rather than an obvious embedded website widget.
- The museum website describes Rosie’s scope as questions “about the art inside the galleries.”

### What has *not* been publicly confirmed in the sources reviewed

- The underlying LLM/provider/model.
- Whether Rosie uses retrieval-augmented generation (RAG), a custom knowledge graph, vector database, or rules-based branching.
- Whether it uses speech input/output, image recognition, geolocation, Bluetooth beacons, or an indoor map.
- Any public API, API documentation, developer portal, API key flow, SDK, rate limits, webhook support, or public terms for programmatic access.
- Ownership/vendor relationship for the current Ask Rosie implementation.
- Data retention, privacy policy specific to Rosie, moderation strategy, analytics schema, or accessibility implementation.

**Practical conclusion:** Treat Ask Rosie’s live backend as **private and unavailable for integration unless Crystal Bridges explicitly provides access**. Do not assume undocumented endpoints discovered through a browser are an authorized or stable API.

---

## 2. Current-tech assessment

Because the public site provides very little technical disclosure, the reliable conclusion is narrow: Ask Rosie is a web-accessible conversational experience under the Crystal Bridges domain.

### Likely product architecture (hypothesis, not verified)

A museum-focused conversational assistant commonly needs the following components:

1. **Web client** — chat interface, onboarding, suggested prompts, responsive/mobile design, accessibility controls.
2. **Conversation service** — session handling, prompts, safety rules, language and response formatting.
3. **Museum knowledge layer** — artwork metadata, artist biographies, curatorial descriptions, exhibition status, gallery/location data, and cited source excerpts.
4. **Retrieval layer** — semantic and/or keyword search over approved content, typically with source filtering and freshness controls.
5. **Generation model** — an LLM that produces visitor-friendly answers constrained by retrieved museum sources.
6. **Analytics and evaluation** — anonymous usage events, unanswered-question queue, curator review, quality/safety feedback, and prompt iteration.

This is a **reference architecture for a prototype**, not a claim about Crystal Bridges’ actual implementation.

### Signals from Crystal Bridges’ public digital work

Crystal Bridges has used web technologies for interactive visitor experiences. A public case study for its prior *We the People* digital display says the display was built with web technologies, involved content strategists, designers, developers, content creators, and curators, and collected engagement analytics. This supports proposing a browser-based, content-reviewed prototype with measurable visitor outcomes.

---

## 3. API-access findings

### Public API status

| Area | Finding | Implication for prototype |
|---|---|---|
| Ask Rosie public API | No public API documentation or developer onboarding was found in the reviewed public sources | Do not design around live Rosie integration |
| Ask Rosie API credentials | No public API-key, OAuth, SDK, or endpoint documentation was found | Use your own backend/API keys, kept server-side |
| Crystal Bridges developer portal | No public developer portal was found in the reviewed sources | Request access directly if the museum wants an integrated pilot |
| Website access | Public web access to the companion and main site is available | Use only public information for research and manual UX observation |
| Collection/content rights | Not established by this research | Use mock data or individually verified public/openly licensed records; ask before production use |

### Recommended approach

Build a **parallel, self-contained prototype**, not a clone of the live product:

- Give it an original working title such as **“Gallery Guide Prototype”** or **“Rosie Next: Concept Demo.”**
- Add a visible label: “Independent concept prototype — not an official Crystal Bridges product.”
- Use a small, curated demo dataset with source URLs and manual approval.
- Implement a mock `MuseumContentAPI` so that switching to a future authorized Crystal Bridges API only requires replacing one adapter.
- Do not scrape protected content, bypass authentication, replay internal requests, or expose third-party API keys in the frontend.

### Questions to send Crystal Bridges

Ask these before proposing a real integration:

1. Is Ask Rosie built in-house or by a vendor, and who owns the integration decision?
2. Is there a sanctioned API, content feed, CMS export, collection API, or data-sharing agreement for pilots?
3. What content sources are approved for visitor-facing answers?
4. Are answers required to show curatorial citations, artwork links, or confidence/disclaimer language?
5. What visitor data may be collected, and what retention/consent rules apply?
6. Which accessibility standards and languages are required?
7. Can a pilot use an official logo, gallery/location information, artwork images, or the name “Rosie”?
8. What does success look like: dwell time, learning outcome, wayfinding success, ticket conversion, staff burden reduction, or another metric?

---

## 4. Prototype concept: features worth pitching

The strongest pitch is not “a better chatbot.” It is a **curator-grounded gallery companion** that helps visitors discover, understand, and navigate art while giving staff controlled content and useful learning analytics.

### Feature roadmap

| Feature | Visitor value | Prototype implementation |
|---|---|---|
| Citation-first answers | Makes claims traceable to approved museum/curatorial sources | Every answer returns 1–3 source cards with title, author/date when available, and link |
| “Look closer” mode | Prompts visual analysis rather than only giving facts | Use structured prompts: notice, evidence, interpretation, question |
| Artwork comparison | Connects works by theme, period, technique, place, or social context | Retrieve two mock artwork records and generate a side-by-side comparison |
| Adaptive depth | Works for young visitors, families, students, and art enthusiasts | Toggle: “Quick,” “Student,” “Deep dive,” and “Teacher prompt” |
| Gallery-aware wayfinding | Helps users get from interest to a physical encounter | Prototype with manually entered gallery/zone labels and a simple map/route card |
| Exhibition freshness | Avoids directing visitors to artwork that is not currently on view | Add `onView`, `exhibition`, `gallery`, and `lastVerified` metadata fields |
| Voice-friendly interaction | Supports hands-free use and accessibility | Prototype browser speech input/output only after consent; retain no audio by default |
| Multilingual interaction | Expands access for visitors | Demonstrate English plus one additional language, while preserving citations |
| “Save my trail” | Lets visitors leave with a personalized list of works | Local-only browser storage or anonymous session export; do not collect identities in MVP |
| Curator/staff review queue | Turns weak answers into a content improvement loop | Admin mock screen listing unanswered questions and feedback tags |
| Safety and uncertainty behavior | Reduces confident but unsupported claims | Refuse to invent facts; say “I couldn’t verify that in this prototype’s sources” |

### Differentiator: learning over answer generation

A compelling demo can pair an answer with a short interaction:

**Visitor asks:** “Why does this painting feel unsettling?”

**Prototype response flow:**

1. Give a 2–3 sentence evidence-grounded answer.
2. Highlight visible choices: color, scale, figures, lighting, composition, material.
3. Ask one optional open-ended question: “What detail changes your reaction most?”
4. Offer related works or a nearby thematic stop.
5. Show sources beneath the response.

This moves the experience from “chatbot fact lookup” toward museum interpretation and visitor reflection.

---

## 5. Suggested technical design

### System diagram

```text
[Responsive web app]
        |
        v
[Your server-side API / session layer]
        |
        +--> [Approved demo content store]
        |         - artwork metadata
        |         - curatorial text
        |         - gallery/exhibition status
        |         - citations/source URLs
        |
        +--> [Retrieval service]
        |         - keyword + semantic retrieval
        |         - filters: on view, gallery, language, source type
        |
        +--> [LLM provider]
                  - grounded-answer prompt
                  - structured JSON output
                  - safety / uncertainty rules
```

### Recommended stack for a fast, credible demo

| Layer | Suggested option | Why |
|---|---|---|
| Frontend | Next.js/React + TypeScript, or a polished SwiftUI iPad companion if presenting in person | Fast component development and good presentation quality |
| Styling | Tailwind CSS or a small custom design system | Rapid responsive UI with consistent spacing and accessibility |
| Backend | Next.js route handlers, FastAPI, or Express | Keeps LLM keys and retrieval logic off the client |
| Database | Supabase/Postgres, Firebase, or a local JSON dataset for a limited demo | Easy structured metadata and feedback storage |
| Retrieval | Postgres pgvector, Pinecone, or an in-memory local index for the demo | Supports grounded answers from approved content |
| LLM | Any approved provider selected by your team | Keep provider behind an adapter; make it replaceable |
| Observability | Privacy-conscious event logging + manual review dashboard | Lets you measure unanswered questions and feature use |

### Content record shape

```json
{
  "id": "demo-work-001",
  "title": "Example Artwork",
  "artist": "Example Artist",
  "date": "1900",
  "medium": "Oil on canvas",
  "description": "Curator-approved or demo-written description.",
  "themes": ["identity", "landscape"],
  "onView": true,
  "gallery": "Demo Gallery A",
  "exhibition": "Prototype Exhibition",
  "lastVerified": "2026-08-21",
  "sources": [
    {
      "label": "Collection record",
      "url": "https://example.org/source",
      "excerpt": "Short approved excerpt used for retrieval."
    }
  ]
}
```

### Grounded-answer contract

Have the server request structured output, then render it safely:

```json
{
  "answer": "A short visitor-friendly response grounded only in the supplied sources.",
  "confidence": "high",
  "evidence": [
    {
      "recordId": "demo-work-001",
      "claim": "The work uses a compressed perspective.",
      "sourceLabel": "Collection record"
    }
  ],
  "followUpQuestion": "What detail stands out to you first?",
  "suggestedActions": ["Compare another work", "Find it on the map"]
}
```

### Important product rules

- Only answer factual questions from retrieved, approved sources.
- Separate **facts** from **interpretive suggestions**.
- Never invent artwork availability, gallery locations, artist quotes, accessibility services, tickets, hours, or event information.
- Show `lastVerified` for any operational information.
- Use a clear fallback: “I don’t have a verified answer for that yet. Here are related works or a staff-help option.”
- Do not retain minors’ personal data or raw voice recordings in a school prototype.

---

## 6. MVP build plan

### Phase 1 — 1–2 days: UX proof

- Create a mobile-first chat UI with suggested prompts.
- Add 8–15 manually curated demo artwork records.
- Implement canned answers or a local mock API.
- Build three polished flows: artwork explanation, comparison, and “look closer.”

### Phase 2 — 2–4 days: grounded AI

- Add a server-side chat endpoint.
- Add retrieval over your demo records.
- Require citations in all factual responses.
- Add source cards, confidence/fallback behavior, and a feedback control.

### Phase 3 — 2–3 days: proposal features

- Add a simple gallery map/wayfinding card using clearly fictional or approved locations.
- Add depth/audience controls.
- Add a saved trail stored locally in the browser.
- Add a mock curator dashboard with question themes and “needs review” items.

### Phase 4 — presentation

Show a 3-minute story:

1. A visitor sees an artwork and asks a natural-language question.
2. The prototype answers with a concise explanation and visible sources.
3. The visitor chooses “Look closer,” receives an observation prompt, and saves the work.
4. The visitor compares it with another work or gets a route to a related stop.
5. A staff dashboard reveals what visitors were curious about, without exposing personal identities.

---

## 7. Evaluation metrics

Define success before making claims about improvement.

| Goal | Example metric |
|---|---|
| Visitor engagement | Conversations started; average turns per session; feature completion rate |
| Learning/reflection | % of users who respond to a “look closer” prompt; voluntary one-question exit survey |
| Answer quality | Curator-rated groundedness; citation click rate; hallucination/error rate |
| Discoverability | % of visitors who open a related work or map card |
| Inclusion | Completion by device size/language; accessibility issue reports |
| Operational insight | Top unanswered intents; topics requiring curator content additions |

Avoid measuring success only through raw chat volume. A museum companion should optimize for understanding, reflection, accessibility, and confident discovery.

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated art facts | Retrieval-only factual answers, inline sources, strict fallback behavior, curator review |
| Outdated exhibition/location data | `lastVerified` field, visible freshness label, manual content publishing workflow |
| Copyright/content use concerns | Use original mock content for the pitch; obtain permission before using collection imagery/text at scale |
| Brand confusion | Prominent independent-prototype label; do not publish as “Ask Rosie” or impersonate the museum |
| Privacy concerns | Anonymous sessions by default; data minimization; no raw voice retention; explicit consent for optional feedback |
| Accessibility gaps | Keyboard navigation, high contrast, readable type, semantic labels, captioned/non-audio alternatives, plain-language mode |
| Over-automation of interpretation | Label interpretations as prompts or perspectives; preserve multiple readings and curator authority |

---

## 9. Outreach draft

**Subject:** Independent concept prototype for an enhanced Ask Rosie visitor experience

Hello [Name],

I’m a Bentonville student developer building an independent, non-production concept prototype inspired by the visitor value of Ask Rosie. My goal is to demonstrate possible additions such as citation-first art answers, adaptive learning modes, gallery-aware discovery, and a privacy-conscious feedback loop for staff.

Before I use any official branding, collection content, images, or live integrations, I would appreciate guidance on whether Crystal Bridges has a sanctioned API, collection/content feed, pilot process, or technical contact. I can present the prototype using original mock content and make clear that it is not an official museum product.

Would you be open to a short conversation or point me to the appropriate digital, visitor experience, collections, or innovation contact?

Thank you,
[Your Name]

---

## 10. Public sources reviewed

- Crystal Bridges Museum of American Art homepage: describes Ask Rosie as a digital companion that answers questions about art inside the galleries.  
  https://crystalbridges.org/
- Ask Rosie public companion page: public introductory language and access point.  
  https://askrosie.crystalbridges.org/en
- Few case study, “Crystal Bridges We the People Digital Experience”: describes an earlier Crystal Bridges interactive display built with web technologies, curatorial collaboration, and engagement analytics.  
  https://few.io/launches/crystal-bridges

---

## Bottom line

Public evidence confirms a web-based, art-focused Ask Rosie experience, but **does not confirm a public API or reveal its underlying AI stack**. The best proposal is an original, self-contained, citation-first prototype that proves visitor value and is architected to connect to sanctioned Crystal Bridges content/services later, if the museum chooses to provide access.
