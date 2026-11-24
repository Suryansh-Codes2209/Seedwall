import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "A mesh gradient is a smooth blend of several colours that meet in soft, irregular areas, instead of the straight line of a linear gradient or the rings of a radial one. Design tools such as Illustrator introduced gradient meshes for this, and the soft, glowing backgrounds that followed became common on app landing pages and phone lock screens.",
    "This generator gets the same effect in a simpler way. It drops a handful of coloured ovals on a base colour and blurs them heavily, so they melt into each other. Film grain on top stops the blends from banding into visible steps and gives a slightly photographic finish.",
  ],
  howItWorks: [
    "The canvas starts as a flat rectangle in the Base colour. The code then places a set of ellipses, one for each blob. Each gets a random position that can fall slightly outside the screen edges, a random width, a height between about sixty and one hundred and twenty percent of its width, and a random opacity between seventy five and one hundred percent. The blobs cycle through Colour 1 to Colour 4 in order, so with six blobs the first two colours appear twice.",
    "All the ellipses are grouped and passed through one Gaussian blur. The strength of that blur comes from the Softness setting and is scaled to the screen, so the look is consistent on a small phone and a large monitor. Where two blobs overlap, the later one is drawn on top, and the blur turns their shared edge into a gradual transition.",
    "Last, if Film grain is above zero, a layer of fine noise is laid across the whole image, and any quote is drawn on top of that.",
  ],
  settings: [
    { name: "Blobs", text: "How many colour patches there are, from 3 to 10. Fewer blobs give large, calm fields with more of the base showing. More blobs give a busier, more even mix." },
    { name: "Softness", text: "The blur strength. At the low end, around 6, the blobs keep recognisable outlines like out of focus lights. At 30 and above, everything dissolves into a haze." },
    { name: "Film grain", text: "Fine noise over the top. Around 0.08 to 0.12 is enough to hide colour banding on most screens. Set it to zero for a perfectly clean blend." },
    { name: "Base", text: "The colour that shows wherever the blobs thin out, especially around the edges. It sets the overall mood, so a dark base gives a dark wallpaper even with bright blob colours." },
    { name: "Colour 1 to Colour 4", text: "The four blob colours. Neighbouring hues blend smoothly. Complementary pairs can produce muddy greys where they mix, so check the overlaps." },
  ],
  bestFor: [
    "Mesh gradients have no lines or detail, so they never fight with icons or widgets. They work well on phones and on desktops with lots of windows open. Peach, the default, is warm and light. Soft pastel, Mint and Earth tones are gentle choices for light themes. For dark mode, try Violet dusk, Dusk or Lagoon, which use deep bases with brighter blobs.",
    "Ember + quote shows how the background behaves as a backdrop for text, with a two line quote over dark reds and oranges. This generator has no True black (OLED) toggle, because the blur needs a coloured base to blend into.",
  ],
  faq: [
    { q: "Why do I see faint stripes or steps in the gradient?", a: "That is colour banding, which happens when a display cannot show enough shades between two close colours. Raise Film grain a little; the noise breaks up the steps." },
    { q: "Why does the same colour appear twice?", a: "Blobs take Colour 1 to Colour 4 in turn, so any count above four repeats colours. Set Blobs to 4 if you want each colour once." },
    { q: "How do I get a very different layout without changing colours?", a: "Change the seed. It decides every blob's position, size, shape and opacity, so the colours stay the same while the arrangement changes." },
  ],
};

export default guide;
