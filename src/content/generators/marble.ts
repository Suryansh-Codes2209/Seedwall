import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Liquid Marble produces swirling bands of colour like polished stone or marbled paper. Marbling is an old craft: in Turkey it is called ebru, and in Japan an older form is suminagashi, where ink floats on water and is pushed into swirls before a sheet of paper lifts the pattern.",
    "The generator does not imitate any one stone. It starts with plain parallel stripes and bends them with noise until they curl and fold, then fills the regions between them with solid colour. The result is crisp edged, with fine veins tracing some of the boundaries.",
  ],
  howItWorks: [
    "For every point on a grid that covers the screen, the code computes a single number. The first part is simply how far that point lies along a chosen direction, which on its own would give straight, evenly spaced stripes. The second part is a technique called domain warping: the code samples layered noise, uses the result to shift the coordinates, and samples noise again at the shifted position. That double lookup gives the folded, flowing shapes that ordinary noise lacks. The warped value, multiplied by Swirl, is added to the stripe value.",
    "The code then traces the boundary at every whole number step of that field using marching squares, the same method used to draw contour lines on maps. Because the edge of the grid is forced very low, every boundary closes into a loop, so each band can be filled as a shape. The bands are painted from lowest to highest, each one in a colour picked at random from Ink 1, Ink 2, Ink 3 and Base.",
    "If Veins is on, roughly three in ten band boundaries are also stroked with a thin line in the Vein colour. A light layer of film grain finishes the surface.",
  ],
  settings: [
    { name: "Bands", text: "How many stripes cross the screen before warping, from 4 to 40. Low values give broad slabs of colour; high values give tight, agate like layering, as in Malachite." },
    { name: "Swirl", text: "How strongly the noise bends the stripes. At 0 you get straight bands. Around 4 they flow; above 7 they fold back on themselves into curls." },
    { name: "Turbulence", text: "The scale of the noise. Low values make large, lazy swirls. High values add smaller eddies and a busier surface." },
    { name: "Flow angle", text: "The direction of the underlying stripes, in degrees. It sets the general grain of the marble, which matters when you want the flow to run along a long screen edge." },
    { name: "Veins", text: "Toggles the fine lines on some band edges. They add the look of mineral seams, especially in metallic colours. Ink wash turns them off for a pure ink look." },
    { name: "Ink 1, Ink 2, Ink 3, Base, Vein", text: "The four band colours and the vein colour. Because each band picks from the four at random, similar inks produce subtle stone and contrasting ones produce bold marbled paper." },
  ],
  bestFor: [
    "Marble has no focal point, so it crops well to any aspect ratio and suits both phones and wide monitors. Navy + gold, the default, is a classic pale stone with gold veins. Black marble, gold veins and Black marble, copper veins are near black and are the best picks for dark mode. Rose quartz is soft and light. Nebula (quote) uses deep purple and pink with a quote turned on.",
    "There is no True black (OLED) toggle here, since every colour participates in the bands. For an OLED screen, use one of the black marble presets and lower Film grain to zero to keep the dark areas as deep as possible.",
  ],
  faq: [
    { q: "Why does the same colour sometimes appear in two neighbouring bands?", a: "Each band picks its colour at random from the four, so two adjacent bands can match. When they do, they merge visually into one wider band. Change the seed if a large area ends up in one colour." },
    { q: "Are the veins placed on purpose?", a: "Not individually. Each band boundary has about a thirty percent chance of getting a vein, decided by the seed, which keeps them irregular like real mineral lines." },
    { q: "How is this different from the Topographic generator?", a: "Both trace contour lines through a field, but marble warps a field of stripes and fills the regions with solid colour, while Topographic draws only lines over plain noise." },
  ],
};

export default guide;
