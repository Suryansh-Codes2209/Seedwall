import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Impasto is a palette-knife oil painting. The word comes from Italian for paste or dough, and it describes paint laid on so thickly that every stroke stands up from the canvas and catches the light. Painters from Rembrandt to Van Gogh used it.",
    "This is the most involved generator I have built. It decides where light and dark should fall in a scene, then paints that scene with thousands of individual knife strokes, each one modelled with its own lit face, shadow side and grooves.",
  ],
  howItWorks: [
    "Each Subject is a small description of a scene that answers three questions for any point: how light or dark it is, whether it should carry the hot accent colour, and which direction a stroke there should follow. Wood panels is a wall of raised panels with frames, bevels that catch or lose the light, dark seams and wood grain. Sun over water has a sun disc, cloudy sky, a dark shoreline and a rippled reflection column. Blooms places three to five flowers with lobed petals and accent-coloured centres. Mountains stacks four ridged ranges with snow on the far peaks and haze in the valleys. Abstract drift is softly stepped noise with patches of accent.",
    "Tone is mapped through a four-step colour ramp from Ground to Shadow to Mid tone to Light, with Hot accent mixed in where the scene asks for it. A vignette darkens the edges. Then the knife works in three passes: large, fairly flat block-in strokes like an underpainting, a body pass of medium strokes with full relief, and a detail pass of small strokes that gather where the tone changes quickly, at the edges of forms. Every stroke has a crisp skewed leading edge, a ragged tail, a ridge that splits it into a lit face and a shadowed face, a glint, a cast shadow and drag grooves.",
    "Behind your text, the painter leaves a calm passage. Tones are pulled toward a flat light or dark depending on your text colour, accents fade, relief drops and detail strokes are skipped, so the words sit on smooth paint rather than fighting a busy surface.",
  ],
  settings: [
    { name: "Subject", text: "Wood panels, Sun over water, Blooms, Mountains or Abstract drift. This changes the whole composition; colours carry over between subjects." },
    { name: "Knife size", text: "Scales every stroke and its spacing. Larger knives give fewer, broader strokes and a looser painting; smaller ones give more detail." },
    { name: "Paint thickness", text: "How strongly ridges, highlights and shadows are drawn. At 0 the strokes keep only a faint split between their two faces, with no glints, cast shadows or grooves; near 1 the paint looks heavy and sculpted." },
    { name: "Broken colour", text: "How much each stroke wanders from the exact tone, how often a stray stroke of a neighbouring tone appears, and how much colour the knife carries from one stroke to the next." },
    { name: "Light from", text: "Top left, Above or Top right. It decides which faces of each stroke and of the scene catch the light." },
  ],
  bestFor: [
    "The rich texture works best at larger sizes, so it shines on desktop and tablet screens; on a phone, a bigger Knife size keeps strokes readable rather than fussy. Ember Panels is the default warm wood wall, Midnight Panels the same subject in cool greys. Harbour Dusk paints a sunset over water, Still Life shows blooms on dark green, Alpine is pale mountains with dark text, and Ochre Drift is an abstract in earth tones with teal accents.",
    "There is no True black (OLED) toggle, because the painting covers the whole canvas with strokes. Midnight Panels is the darkest starting point.",
  ],
  faq: [
    { q: "Is this made from a photo?", a: "No. Every scene is described by code and painted stroke by stroke. Nothing is traced from an image." },
    { q: "Why does the area behind my text look smoother?", a: "That is deliberate. The painter flattens the paint behind the words, the way an artist leaves a quiet passage for a signature or title, so the text stays readable." },
    { q: "Why does it take a moment to render?", a: "It draws thousands of strokes in three passes, each with several layers. Raising Knife size reduces the stroke count and speeds things up." },
  ],
};

export default guide;
