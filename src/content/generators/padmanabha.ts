import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Padmanabha means \"the one with a lotus at the navel\", and it is a name of Vishnu. In the creation accounts of the Puranas, Vishnu rests on the serpent Shesha on the cosmic ocean between cycles of the universe. A lotus grows from his navel on a long stem, and Brahma appears seated in the flower and begins to create the world. The image is central to Vaishnava art and gives its name to the Padmanabhaswamy temple in Thiruvananthapuram.",
    "This wallpaper shows the moment of that creation rather than the full scene. You see the dark ocean, a single stem rising from it, the open lotus, and light spreading outward from the flower as rays and newborn stars. The default quote, \"नाभि से कमल, कमल से सृष्टि।\", reads \"from the navel a lotus, from the lotus creation\".",
  ],
  howItWorks: [
    "The sky is a vertical gradient that ends in the Horizon colour, and a large soft glow in the Light of creation colour surrounds the flower. The ocean fills the lower fifth or so of the screen, with a faint line of light along the horizon, rings of ripples where the stem meets the water, a floating leaf, and short horizontal glints that reflect the glow.",
    "The lotus is built from one petal shape repeated and rotated. Two drooping sepals sit behind, then a back row of nine long petals fanned wide, then a middle row of seven. The glowing seed pod, where Brahma sits, comes next, and four short front petals cup around it. Each row has its own shading, darker behind and lighter in front, with every petal blending from Petal base to Petal tip and a fine central vein. The Open setting controls how far the rows fan out and how high the pod sits. The stem is a long, gentle S curve from below the bottom edge up to the flower.",
    "Rays are thin lines that start just outside the flower and reach outward, mostly upward. New stars are scattered around the pod, more of them close in, and none fall below the horizon. If the quote would overlap the flower, the lotus shrinks and moves into the free part of the sky.",
  ],
  settings: [
    { name: "Lotus size", text: "Scales the whole flower. Larger values make a dramatic centrepiece on phones; smaller values leave more room for the rays and stars." },
    { name: "Open", text: "How far the petals fan apart. Near 0.3 the flower is a closed bud, as in Before creation. Near 1 it is fully open." },
    { name: "Rays", text: "How many lines of light spread from the flower, from 0 to 120. Zero gives a quiet, still image." },
    { name: "New stars", text: "How many small points of light are scattered around the flower. They thin out with distance, so even high counts keep the edges calm." },
    { name: "Petal base, Petal tip, Stem, Light of creation", text: "The flower and light colours. A warm light behind a cool petal colour, as in Blue lotus, gives the strongest separation." },
  ],
  bestFor: [
    "The composition is vertical, with sky above, flower in the middle and ocean below, so it fits phones naturally. On a wide monitor the flower stays centred and the rays spread into the extra width. Pink lotus is the default. Blue lotus uses a nilotpala blue flower with cool light. Golden lotus is dark with amber petals and more rays. Before creation keeps the bud closed with no rays and few stars, for a quieter screen.",
    "For OLED phones, the True black (OLED) toggle sets the sky, horizon and ocean to pure black, leaving only the flower, glow and stars lit. Dawn (light) is the preset for light themes, with a pale sky and dark brown text.",
  ],
  faq: [
    { q: "Where is Vishnu in the image?", a: "He is not drawn. The wallpaper focuses on the lotus and the light of creation, with the stem rising from the dark ocean below, where Vishnu rests in the story." },
    { q: "Why did the flower get smaller when I added text?", a: "The generator fits the lotus into the space the quote leaves free in the sky, so the two never overlap. Move the quote to a corner to give the flower more room." },
    { q: "Can I change the quote language?", a: "Yes. Type any text in the quote lines and choose a different Font. The Hindi font is only the default." },
  ],
};

export default guide;
