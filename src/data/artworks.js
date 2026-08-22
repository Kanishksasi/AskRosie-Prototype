// Demo artwork catalog for the prototype's "browse the collection" feature.
// These are placeholder pieces (not the real Crystal Bridges collection or
// API) so the app has something to filter/browse/chat about without needing
// museum data access. Swap `fetchArtworks()` for a real MuseumContentAPI
// adapter later — every consumer in the app goes through the functions
// below, not the ARTWORKS array directly, so that's the one place to change.
//
// `sources` follows the citation-first contract: the chat backend is told
// these are the ONLY facts it may cite as verified for a given piece —
// everything else has to be flagged as interpretation or "can't verify."
//
// `image`/`imageCredit`: since the artworks above are fictional demo
// entries, each is paired with a real, thematically-matching public-domain
// image (via the Art Institute of Chicago's open API, CC0-licensed) as a
// visual stand-in — not a claim that this IS that painting. imageCredit
// names the real work so that's never ambiguous.

export const ARTWORKS = [
  {
    id: "sunlit-orchard",
    title: "Sunlit Orchard",
    artist: "Marta Voss",
    year: 1932,
    decade: "1930s",
    medium: "Oil on canvas",
    palette: ["#e8b04b", "#7c9a53", "#f4e3c1"],
    image: "/artworks/sunlit-orchard.jpg",
    imageCredit: "Stand-in image: Claude Monet, \"Stack of Wheat (Thaw, Sunset),\" 1890–91 — Art Institute of Chicago, public domain",
    blurb: "A golden-hour orchard scene with long, warm shadows.",
    themes: ["landscape", "rural life", "light"],
    onView: true,
    gallery: "Demo Gallery A",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/sunlit-orchard",
        excerpt: "Painted en plein air; the artist was known for warm, low-angle light studies of orchards near her studio.",
      },
    ],
  },
  {
    id: "steel-horizon",
    title: "Steel Horizon",
    artist: "Devon Ochoa",
    year: 1968,
    decade: "1960s",
    medium: "Welded steel sculpture",
    palette: ["#6b7280", "#1f2937", "#9ca3af"],
    image: "/artworks/steel-horizon.jpg",
    imageCredit: "Stand-in image: Vasily Kandinsky, \"Landscape with Two Poplars,\" 1912 — Art Institute of Chicago, public domain",
    blurb: "An abstract sculpture of interlocking steel arcs.",
    themes: ["abstraction", "industrial material", "scale"],
    onView: true,
    gallery: "Demo Gallery B",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/steel-horizon",
        excerpt: "Part of a series exploring balance and tension using salvaged industrial steel.",
      },
    ],
  },
  {
    id: "river-portrait",
    title: "Portrait by the River",
    artist: "Helene Bright",
    year: 1901,
    decade: "1900s",
    medium: "Oil on canvas",
    palette: ["#7a3b2e", "#c9a86a", "#2f4858"],
    image: "/artworks/river-portrait.jpg",
    imageCredit: "Stand-in image: Édouard Manet, \"Woman Reading,\" 1880–82 — Art Institute of Chicago, public domain",
    blurb: "A quiet riverside portrait in a muted, earthy palette.",
    themes: ["portraiture", "everyday life"],
    onView: false,
    gallery: "Demo Storage",
    exhibition: null,
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/river-portrait",
        excerpt: "Currently off view for conservation review in this demo dataset.",
      },
    ],
  },
  {
    id: "quilted-geometry",
    title: "Quilted Geometry No. 4",
    artist: "Ida Falk",
    year: 1978,
    decade: "1970s",
    medium: "Fabric and thread",
    palette: ["#c0432b", "#05515f", "#f4e3c1"],
    blurb: "A hand-stitched quilt with bold, repeating geometric blocks.",
    themes: ["craft", "abstraction", "pattern"],
    onView: true,
    gallery: "Demo Gallery C",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/quilted-geometry",
        excerpt: "Fourth in a numbered series exploring repeated geometric blocks in hand-dyed fabric.",
      },
    ],
  },
  {
    id: "glass-tide",
    title: "Glass Tide",
    artist: "Priya Anand",
    year: 2005,
    decade: "2000s",
    medium: "Blown glass installation",
    palette: ["#2f6690", "#a3d5ff", "#e8f6ff"],
    image: "/artworks/glass-tide.jpg",
    imageCredit: "Stand-in image: Mount Washington Glass Company, \"Royal Flemish Vase,\" 1889–95 — Art Institute of Chicago, public domain",
    blurb: "Suspended glass forms that catch light like ocean spray.",
    themes: ["installation", "nature", "light"],
    onView: true,
    gallery: "Demo Atrium",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/glass-tide",
        excerpt: "Suspended installation of blown-glass forms, designed to shift color as visitors move beneath it.",
      },
    ],
  },
  {
    id: "market-day",
    title: "Market Day",
    artist: "Marta Voss",
    year: 1945,
    decade: "1940s",
    medium: "Watercolor on paper",
    palette: ["#e8b04b", "#c0432b", "#511e11"],
    image: "/artworks/market-day.jpg",
    imageCredit: "Stand-in image: Constant Troyon, \"The Road to Market,\" 1858–59 — Art Institute of Chicago, public domain",
    blurb: "A bustling watercolor sketch of a small-town market square.",
    themes: ["everyday life", "community"],
    onView: true,
    gallery: "Demo Gallery A",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/market-day",
        excerpt: "A rapid watercolor study made on-site at a weekly market, part of the artist's later sketchbook period.",
      },
    ],
  },
  {
    id: "bronze-stride",
    title: "Bronze Stride",
    artist: "Devon Ochoa",
    year: 1955,
    decade: "1950s",
    medium: "Cast bronze sculpture",
    palette: ["#8a5a2b", "#3b160c", "#c9a86a"],
    image: "/artworks/bronze-stride.jpg",
    imageCredit: "Stand-in image: attributed to Pietro Tacca, \"Hercules and Antaeus,\" 1600–1625 — Art Institute of Chicago, public domain",
    blurb: "A mid-stride figure cast in weathered bronze.",
    themes: ["figure", "movement"],
    onView: true,
    gallery: "Demo Gallery B",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/bronze-stride",
        excerpt: "An early figurative bronze cast before the artist moved toward pure abstraction.",
      },
    ],
  },
  {
    id: "prairie-night",
    title: "Prairie Night",
    artist: "Helene Bright",
    year: 1988,
    decade: "1980s",
    medium: "Acrylic on canvas",
    palette: ["#12213a", "#3b5a8a", "#e8e3d3"],
    blurb: "A star-filled prairie sky rendered in deep blues.",
    themes: ["landscape", "night", "place"],
    onView: true,
    gallery: "Demo Gallery C",
    exhibition: "Prototype Collection",
    lastVerified: "2026-08-21",
    sources: [
      {
        label: "Demo collection record",
        url: "https://example.org/demo/prairie-night",
        excerpt: "Painted from memory of the artist's childhood home on the plains.",
      },
    ],
  },
];

export function fetchArtworks() {
  return ARTWORKS;
}

export function getArtwork(id) {
  return ARTWORKS.find((a) => a.id === id) ?? null;
}
