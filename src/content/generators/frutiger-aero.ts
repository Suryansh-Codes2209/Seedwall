import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Frutiger Aero is the name people now give to the glossy, optimistic visual style of roughly the mid 2000s to early 2010s: bright blue skies, see-through bubbles, lens flares, wet-looking green hills, water, and everything with a shiny highlight on top. You saw it in operating system wallpapers, phone adverts, software installers and stock photos. The label was coined online years later, from the Frutiger typeface that was everywhere at the time and the Aero glass look of desktop windows.",
    "I built this to capture that mood without using any photos.",
  ],
  howItWorks: [
    "The sky is a vertical gradient from Sky top to Sky bottom, reaching the bottom colour three quarters of the way down. A soft white sun glow sits at a random point above the top edge; it is strong on a bright sky and much weaker when Sky top is dark. From that point, nine thin wedges of light fan downward at random angles, blurred slightly, with their brightness set by Light rays. If Light swooshes is on, three wide translucent white ribbons arc across the middle of the screen, fading out at both ends.",
    "The ground is a broad curve along the bottom. Water is a low, slightly rippled line with seven long white glints across its surface. Grassy hill rises in a smooth bump with a paler second hill behind it for depth and a sheen across the top. Both are filled with a gradient that is light at the crest and darker toward the bottom, and both get a soft white highlight along their top edge, like light catching a curved glossy surface.",
    "Bubbles are placed one by one at random sizes, with an occasional extra-large one. A bubble is rejected if it would overlap the quote or sit too close to another bubble, and the small ones are drawn first so the big ones sit in front. Each bubble is a tinted, mostly transparent sphere with a bright white rim, a large highlight across the top, a faint bounce light at the bottom and a tiny glint on the left. Sparkles are small four-pointed stars scattered above the ground.",
  ],
  settings: [
    { name: "Ground", text: "Water, Grassy hill, or None, just sky. With no ground, bubbles can float lower down the screen." },
    { name: "Bubbles and Bubble size", text: "Up to 40 bubbles, scaled together by Bubble size. If you ask for many large bubbles, fewer will appear because each one needs its own space." },
    { name: "Light rays", text: "Brightness of the light shafts from above. Set it to 0 for a clean sky." },
  ],
  bestFor: [
    "The ground hugs the bottom and the sky stays open, so it works as a phone wallpaper with icons over the sky and the dock over the water. On desktop, the wide sky shows off the rays and swooshes. Start from Sky bubbles for the classic blue, Meadow for a green hill and fewer, bigger bubbles, Lagoon for many small bubbles over turquoise water, or Eco lime for an all-green version. Night + quote moves the whole scene into deep navy and shows the text.",
    "True black (OLED) works differently here. It replaces the sky with pure black and drops the sun glow and light rays, dims the swooshes, and lifts the text colour if needed so it stays readable. The water or grass and the bubbles keep their colours, so you get glossy shapes floating in black.",
  ],
  faq: [
    { q: "Is this a copy of an old Windows wallpaper?", a: "No. Nothing here is a photo or an existing image. It is built from gradients and shapes to recreate the general style of that era." },
    { q: "Why do the bubbles avoid my text?", a: "Any bubble that would overlap the quote is rejected and placed somewhere else. Sparkles are masked out behind the words as well." },
    { q: "I asked for 40 bubbles but see fewer. Why?", a: "Each bubble needs clear space from the others and from the text, and there is a limit on attempts. Lower Bubble size to fit more." },
  ],
};

export default guide;
