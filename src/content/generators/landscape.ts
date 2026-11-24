import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Landscape builds a flat, layered scene: a gradient sky, an optional sun, and rows of hills that get darker as they come closer. The look borrows from two places. One is the old painter's trick of atmospheric perspective, where distant ridges fade toward the colour of the sky. The other is the flat vector style of travel posters and lo-fi music art, where a scene is reduced to a few clean shapes.",
    "It can also switch into a synthwave mode, with a striped retro sun sitting on the horizon and a glowing perspective grid running toward the viewer, the image that 1980s album covers and arcade cabinets made familiar.",
  ],
  howItWorks: [
    "The sky is a vertical gradient from Sky top to Sky horizon. Stars, when on, are about a hundred and twenty small white dots in the upper sky. The sun is a circle filled with a gradient from Sun top to Sun bottom, placed somewhere near the middle and set low enough that its lower part sinks behind the hills. With Retro sun stripes on, seven horizontal bars are cut out of the lower half of the sun, each a little thicker than the one above.",
    "The hills are drawn back to front. For each layer, the code samples a smooth noise function at forty points across the screen, takes its absolute value so the ridgeline has peaks rather than dips, and draws a smooth curve through those points down to the bottom edge. Each layer's colour is a blend between Far hills and Near hills based on its depth, and each sits a bit lower on the screen than the one behind it. Distant layers are allowed taller swings, which makes the back ridges read as mountains and the front ones as gentle slopes.",
    "When Synthwave grid floor is on, the horizon moves lower, the hills are squeezed into a thin band, and the ground below becomes a solid floor in the Near hills colour. Lines in the Sun bottom colour fan out from the centre toward the bottom edge, and horizontal lines are spaced closer near the horizon and wider toward you, which produces the perspective effect.",
  ],
  settings: [
    { name: "Layers", text: "The number of hill rows, from 2 to 9. Two layers give the clean, graphic look of the Synthwave preset. Seven or more create a misty, deep valley, as in Misty blue." },
    { name: "Roughness", text: "How many bumps fit across the screen. Low values give long rolling dunes, as in Desert. High values make jagged, busy ridges." },
    { name: "Far hills and Near hills", text: "The two ends of the hill colour blend. For depth, make Far hills close to the sky colour and Near hills much darker." },
    { name: "Sun, Retro sun stripes, Stars", text: "Toggles for the sky elements. The stripes only show when the sun is on. Stars are white regardless of palette, so they suit dark skies." },
    { name: "Synthwave grid floor", text: "Replaces the lower hills with a perspective grid. It changes the composition a lot, so pair it with a dark sky and bright sun colours." },
    { name: "Film grain", text: "Adds a fine noise texture over the whole image. A little softens the flat colour and gives a printed feel; Lo-fi night uses slightly more." },
  ],
  bestFor: [
    "The horizontal structure fits desktop and laptop screens naturally, since the hills stretch across the width. On a phone the hills occupy the lower half and the sky holds the clock, which also works well. Paper dunes is a warm, light default for daytime themes. Misty blue and Moss forest are calm and low contrast. For dark mode, Lo-fi night pairs a navy sky, a pink horizon and stars with a two line quote.",
    "This generator does not offer the True black (OLED) toggle, because the sky is always a gradient. For the darkest result, start from Synthwave, which uses a near black purple at the top of the sky and as the floor colour.",
  ],
  faq: [
    { q: "Why are the distant hills taller than the near ones?", a: "The amplitude of each layer shrinks as it comes forward. That mimics how distant mountains rise above closer foothills and stops the front layer from blocking the whole scene." },
    { q: "Can I move the sun?", a: "Not directly. Its horizontal position is chosen by the seed within the middle part of the screen, so try a few seeds until it lands where you want it." },
    { q: "Why are the grid lines the same colour as the bottom of the sun?", a: "The grid uses the Sun bottom colour so the floor and sun glow in the same tone, as in classic synthwave art. Change Sun bottom to change both." },
  ],
};

export default guide;
