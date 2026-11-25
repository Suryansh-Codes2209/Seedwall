import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "The Sudarshana Chakra is the spinning discus carried by Vishnu, and by Krishna in the Mahabharata. Its name is often read as \"auspicious sight\". In sculpture and painting it appears as a serrated wheel of fire held on one finger, and in the stories it is a weapon that returns to its bearer after protecting the righteous. It is also worshipped in its own right, as the deity Sudarshana.",
    "This generator draws the discus close up and in motion: a toothed rim of fire, a fine wheel of many spokes, a lotus at the hub, and sparks thrown off the edge. The default Hindi quote, \"चक्र घूमे, धर्म बचे।\", reads roughly \"the wheel turns, dharma is protected\".",
  ],
  howItWorks: [
    "The disc is placed near the centre of the screen and sized from the shorter side. If a quote is present, the disc shrinks and moves into the free band of space the text leaves. Behind it sits a large, soft halo in the Fire colour. The body of the disc is a radial gradient that mixes the Fire colour into the background, brighter at the centre and the rim.",
    "The rim is a ring of teeth, each one a slanted triangle that leans in one direction like a saw blade, so you can tell which way the wheel is turning. It is drawn twice, once blurred for bloom and once sharp with a gradient from Gold to Fire. When Spin is above zero, two faint ghost copies of the teeth trail behind the main ring, a simple motion blur. Inside, the spokes run from an inner ring to an outer ring as gentle curves; the more spin, the more they bend. Thin concentric rings in the Gold colour mark the structure.",
    "At the hub, a white hot glow sits under a ring of lotus petals and a small central dot. Outside the rim, short arcs of light circle the disc, and their number and length grow with spin. Sparks start at the rim and fly off along the direction of travel, angled slightly outward, and they also multiply with spin.",
  ],
  settings: [
    { name: "Teeth on the rim", text: "From 24 to 144 teeth. Fewer teeth read as a bold, graphic blade; more teeth make a fine serrated edge. The default is 108." },
    { name: "Spokes", text: "From 24 to 360 fine spokes. High counts merge into a shimmering texture, evoking the many spoked wheels of temple art." },
    { name: "Size", text: "The diameter of the disc relative to the screen. Large values make it fill a phone; smaller values suit a wide monitor." },
    { name: "Spin", text: "How fast the disc seems to turn. It controls the motion blur on the teeth, the bend of the spokes, the number and length of the light streaks, and how many sparks fly. At 0 the disc is completely still." },
    { name: "Lotus petals at the hub", text: "From 0 to 16 petals at the centre. Zero leaves only the glowing hub." },
  ],
  bestFor: [
    "As a round, centred subject, the discus fits phones best, where it is placed slightly below the middle and sized up. On a desktop it becomes a strong centrepiece with empty space around it. Spinning is the default, gold and orange on deep navy. Fury pushes spin and sparks to the maximum on near black red. At rest (blue) is almost still, in cool blue. Plain disc removes spin, sparks and petals for a monochrome, almost technical drawing.",
    "Gold leaf (light) is the preset for light themes, with brown and gold on cream. For OLED phones, the True black (OLED) toggle makes the background pure black; the halo and disc still glow because they are drawn in the fire colours.",
  ],
  faq: [
    { q: "How can I tell which way the disc is spinning?", a: "The teeth lean forward like a saw blade, and the motion blur ghosts trail behind them. The light streaks and sparks also run around the rim in the same sense." },
    { q: "Why did the disc get smaller when I added a quote?", a: "It fits itself into the largest gap the text leaves, so the words never sit over the wheel. A corner position for the quote leaves the disc larger." },
    { q: "What does the seed change?", a: "The starting rotation of the wheel and the random placement of streaks and sparks. The structure of the disc follows your settings." },
  ],
};

export default guide;
