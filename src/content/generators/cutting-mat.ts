import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Cutting Mat is based on the self-healing mats that live on designers' and model makers' desks: a coloured rubbery sheet printed with a measuring grid, angle guides fanning out from one corner, and tick marks and numbers around the edges.",
    "This one is aimed at people who build things on screens. Each colour comes with a short quote, a longer paragraph and a small rotated caption along the edge, the way a real mat has its brand and specifications printed in the margin.",
  ],
  howItWorks: [
    "The mat is laid out in whole cells. The code subtracts the Margin from each side, divides the shorter remaining side by the Cells setting to get the cell size, and then fits as many complete cells as possible in each direction, centred on the screen. That is why the grid stops short of the edges by a slightly different amount on each axis. A faint half-cell sub-grid is added when cells are large enough, then the cell lines, then heavier lines every five cells and a border around the whole mat.",
    "The grid style decides the detail. Bold grid makes the every-five lines strong and leaves it at that. Fine grid + marks keeps all lines light and adds small plus marks at every second intersection. Fine grid + dots puts a round dot at every intersection instead. Edge ticks run around the outside at half-cell spacing, longer at each cell and longest every five. Edge numbers count cells along all four sides, labelling every cell, every second or every fifth depending on how small they are.",
    "The angled guides are rays from the bottom-left corner of the mat at 15, 30, 45, 60 and 75 degrees, with the 45 degree line solid and the rest dashed, plus dotted quarter arcs and small degree labels. Behind it all, the background can be flat, softened with four blurred diagonal light bands, or darkened with blurred streaks and blobs that read like the shadow of leaves or blinds falling across a desk. Grain, if any, is laid over everything last, including the text.",
  ],
  settings: [
    { name: "Grid style", text: "Bold grid, Fine grid + marks or Fine grid + dots. Bold is the most graphic; the fine styles are quieter and pair well with Edge numbers." },
    { name: "Cells (short side)", text: "How many cells fit across the shorter side, from 12 to 60. Fewer cells feel like a big desk mat; more feel like fine graph paper." },
    { name: "Margin", text: "Space between the mat and the screen edge. Edge numbers add their own extra room on top of this." },
    { name: "Background", text: "Flat, Light bands or Leaf shadow." },
    { name: "Side caption", text: "Up to 60 characters, shown in capitals and rotated along the left edge of the mat. Clear it to remove the caption." },
  ],
  bestFor: [
    "There are six colours, each in three styles, named by colour and style: Blue · Bold, Blue · Light and Blue · Dots, and the same for Black, Cream, Green, Orange and Silver, plus Grey · Leaf shadow (mono). The default text includes a paragraph, which suits a desktop wallpaper. On a phone, clear the Paragraph field and keep the two-line quote, or start from Grey · Leaf shadow (mono), which has larger cells, a wide margin and just a short mono quote.",
    "For dark mode and OLED, the Black presets use near-black with a leaf shadow, and the True black (OLED) toggle makes the mat colour pure black.",
  ],
  faq: [
    { q: "Are the cells real centimetres?", a: "No. The cell size is set by how many cells fit across the short side, so the same setting gives the same look on any screen rather than a fixed physical size." },
    { q: "Do the grid lines run behind my text?", a: "No. The grid, guides and numbers are cleared away around the quote and paragraph, and the text is kept inside the mat rather than in the margin." },
    { q: "Why is the grain on top of the text too?", a: "The grain layer is drawn last so the whole wallpaper looks printed, words included. Set Film grain to 0 if you want perfectly clean text." },
  ],
};

export default guide;
