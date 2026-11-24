import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Event Horizon draws a black hole with a glowing disk of gas around it, in the style made famous by the film Interstellar and by the ray-traced visualisations astrophysicists publish. The striking thing about those images is that you can see the far side of the disk. Gravity near the hole is so strong that light from behind it is bent up over the top and down under the bottom, so the flat disk appears to wrap around the dark centre like a halo.",
    "I chose to draw it with lines rather than soft glows: many thin dashed streaks for the disk, stacked rings for the bent light, and a crisp black circle for the shadow.",
  ],
  howItWorks: [
    "The disk is made of Streaks, each an ellipse around the hole. Its horizontal radius runs from 1.7 times the hole's radius out to Disk reach times the hole's radius, and its vertical radius is that times Disk tilt. Every ellipse is split into two halves. The upper half, the far side of the disk, is drawn first, behind the hole. The lower half, the near side, is drawn last, in front of it. Each streak has its own random width and long dashes, inner streaks use Hot gas, outer ones Cooler gas, and the middle ones a mix, with brightness fading outward.",
    "Every stroke also fades from left to right across the disk. That imitates Doppler beaming: gas moving toward you looks brighter than gas moving away, so a spinning disk is lopsided. Between the two halves of the disk sit the lensed rings: 24 circles stepped upward and outward over the top of the hole, getting fainter as they rise, and 9 thinner ones just under it. Then comes the shadow, a filled circle, and a thin bright ring around its edge.",
    "Glow adds a blurred ellipse along the disk and a blurred ring around the shadow in the Cooler gas colour. Finally the whole system is rotated by a random angle of up to 13 degrees either way, picked by the seed, so it does not always sit perfectly level.",
  ],
  settings: [
    { name: "Hole size", text: "The radius of the shadow. On narrow phone screens it is capped based on the screen width and Disk reach, and the outer disk is allowed to run off the sides rather than the hole shrinking to a dot." },
    { name: "Disk tilt", text: "Low values look edge-on, a thin bright line through the middle. High values look down from above, showing the disk as a wide oval." },
    { name: "Disk reach", text: "How far out the disk extends, as a multiple of the hole size. Long reaches give a sweeping, cinematic disk." },
    { name: "Streaks", text: "How many ellipses make up the disk, from 16 to 90. More streaks give a dense, smooth disk." },
    { name: "Glow", text: "Strength of the blurred light. Set it to 0 for a pure line drawing." },
  ],
  bestFor: [
    "The hole sits just above the centre, so it works on both desktop and phone. On a phone, try a lower tilt so the disk forms a thin band across the screen and stays clear of the clock. Amber disk is the default warm, film-like look. Blueshift turns the gas icy blue, Edge-on drops the tilt and stretches the reach for a thin, wide disk, From above shows the disk as a broad pink oval, and With a quote switches the text on. Ink diagram (light) is the odd one out: a dark ink drawing on cream with no glow or stars.",
    "With True black (OLED), the background becomes pure black and the shadow already is, so on an OLED phone the hole really is a hole in the screen.",
  ],
  faq: [
    { q: "Is this a physically accurate render?", a: "No. It is drawn by hand from the features you see in ray-traced images: the lensed far side, the thin lower ring, the brighter approaching side." },
    { q: "Why is one side of the disk brighter?", a: "The strokes fade from left to right to imitate Doppler beaming, where gas moving toward the viewer appears brighter than gas moving away." },
    { q: "What happens on a light background?", a: "On a light Space colour the shadow is filled with the Hot gas colour instead of black, so it still reads as a solid disc, like an ink diagram." },
  ],
};

export default guide;
