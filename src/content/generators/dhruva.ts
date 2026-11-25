import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Dhruva is named after the boy in Hindu tradition whose steadfast devotion to Vishnu earned him a fixed place in the sky as the pole star, Dhruva Tara. Everything else in the heavens circles around him while he stays put. The default text, in Hindi, says it in four words: everything turns, Dhruva stays still.",
    "Visually it borrows from star trail photography. Point a camera at the northern sky, leave the shutter open for hours, and the Earth's rotation smears every star into an arc around the celestial pole. The longer the exposure, the longer the arcs. I wanted a wallpaper that tells the story and shows the astronomy at the same time.",
  ],
  howItWorks: [
    "First the code fixes the pole star's position: centred near the top for High, a little above the middle for Centre, or toward the upper right for Upper corner. It then measures the distance from that point to the farthest corner of the screen, so trails can reach every part of the display.",
    "Each star is given a distance from the pole and a starting angle. Distances are spread so stars are evenly scattered by area rather than bunched near the centre. From its start, every star sweeps an arc of 15 degrees for each hour of exposure, all in the same direction, which is how the real sky turns. Brightness is skewed so most stars are faint and a few are bold; brighter stars get thicker, more opaque trails. Each star's colour is one of seven steps between Cool stars and Warm stars.",
    "The pole star itself is a small solid dot with a faint halo. If Land is above zero, a dark ridge is drawn along the bottom from fractal noise, so it looks like a distant hill line or mountain range silhouetted against the trails.",
  ],
  settings: [
    { name: "Exposure (hours)", text: "From half an hour to 12 hours. Short exposures give short dashes, almost like a still sky. Around 3 to 6 hours gives the classic arcs. At 12 hours every trail is a half circle." },
    { name: "Stars", text: "From 40 to 900. A few hundred looks like a dark country sky; the top of the range packs the screen with fine concentric lines." },
    { name: "Pole star", text: "High, Centre or Upper corner. Centre puts the pivot in the middle so arcs circle the whole screen; Upper corner puts the pivot off to one side so the arcs sweep across the screen diagonally." },
    { name: "Land", text: "How much of the bottom the ridge may occupy, up to 0.4. Set it to 0 for sky only." },
  ],
  bestFor: [
    "With the pole high on the screen, the trails curve down and around the clock area on a phone, and the land fills the bottom behind the dock. On a desktop, Centre with a long exposure gives a striking target of rings. Long night is the default, three hours over a low ridge. A full night runs eleven hours with the pole centred, almost closing each ring. Himalaya uses a short two-hour exposure, many stars and a tall mountain line. Paper (light) draws ink-coloured trails on cream, and Few stars is a minimal black version with just 60 grey trails from the corner.",
    "For OLED phones, the True black (OLED) toggle sets both Night and Land to pure black, so the ridge vanishes into the sky and only the trails are lit.",
  ],
  faq: [
    { q: "Is 15 degrees an hour accurate?", a: "Yes, close enough. The Earth turns once in a little under 24 hours, so the sky appears to rotate about 15 degrees each hour around the celestial pole." },
    { q: "Does the real pole star never move?", a: "Polaris, the star traditionally identified with Dhruva Tara, sits under a degree from the true pole, so in long exposures it draws a very tiny circle. Here it is drawn perfectly still, which is the point of the story." },
    { q: "Can I change the Hindi text?", a: "Yes. Edit the quote lines and pick any font. The Hindi (Tiro Devanagari) font is selected by default so the Devanagari renders properly." },
  ],
};

export default guide;
