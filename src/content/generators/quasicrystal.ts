import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "A quasicrystal is a structure that is perfectly ordered but never repeats. Ordinary crystals are built from one unit copied in a regular grid, which only allows certain symmetries. In 1982 Dan Shechtman found an alloy whose atoms had fivefold symmetry, which a repeating grid cannot have, and the discovery later earned the Nobel Prize in Chemistry. Penrose tilings and some Islamic geometric patterns show the same kind of ordered but non repeating design.",
    "This generator makes the pattern the way physicists often visualise it: by adding together a few simple waves that cross at evenly spaced angles. Where the waves line up, bright spots and rings form; where they cancel, you get dark gaps. The result is a rosette in the centre surrounded by a field that almost repeats, but never quite does.",
  ],
  howItWorks: [
    "The Symmetry (waves) setting chooses how many waves there are. Each is a plain ripple, like parallel ocean swells, and their directions are spread evenly around half a circle. The seed rotates the whole set by a random amount. For every point on a grid over the screen, the code adds up the height of every wave at that point and averages them, which gives an interference pattern.",
    "When Symmetric about the centre is on, every wave peaks at the middle of the screen. That creates a rosette at the centre with twice as many matching directions as there are waves, so five waves give a ten pointed star. When it is off, each wave gets a random shift, and the pattern loses its centre while keeping the same overall texture.",
    "The code then picks several height levels and traces the outline of the pattern at each one, using marching squares. In Filled bands style, each outline is filled, layered from the lowest level up, with colours stepping from Low colour to High colour and becoming more opaque. In Contour lines style, only the outlines are drawn, with higher levels using slightly thicker lines.",
  ],
  settings: [
    { name: "Symmetry (waves)", text: "How many waves interfere, from 4 to 12. The in-app note recommends 5, 7, 8 and 12 for patterns that never repeat. Higher counts produce finer, more intricate rosettes." },
    { name: "Scale", text: "How many wave crests fit across the screen. Low values give large, bold shapes; high values give dense lace." },
    { name: "Layers", text: "The number of height levels drawn, from 2 to 6. More layers add intermediate tones in band mode and more nested outlines in line mode." },
    { name: "Style", text: "Filled bands or Contour lines. Bands are bolder and work on dark backgrounds; lines are delicate and suit light, paper like palettes." },
    { name: "Symmetric about the centre", text: "Turn it off for a pattern without a single focal point, which can be easier to live with behind icons." },
    { name: "Background, Low colour, High colour", text: "The base and the two ends of the layer colour ramp." },
  ],
  bestFor: [
    "With the centre on, the rosette always sits in the middle of the screen, which works well as a focal point on a phone lock screen or a centred desktop. Fivefold blue is the default, deep navy with blue and peach layers. Sevenfold dusk and Twelvefold jade show higher symmetry. Ink lines (light) uses the contour line style on cream and is the choice for light themes. Drift (off-centre) turns the symmetry off for an even, all over texture.",
    "This generator does not offer the True black (OLED) toggle. For OLED screens, set Background to pure black yourself; the bands are drawn on top of it and the gaps stay black.",
  ],
  faq: [
    { q: "Does the pattern really never repeat?", a: "For suitable wave counts, the waves have no common repeating distance, so no shifted copy of the pattern matches it exactly. On a screen you see only a small window of it, but no part is a tiled copy of another." },
    { q: "Why is the centre so detailed?", a: "When the waves are centred, every one of them peaks at the same point, so their sum is largest there and the symmetry is most obvious." },
    { q: "What does the seed change?", a: "The overall rotation of the waves, and, when the centre option is off, the shift of each wave. Wave count, scale and colours come from your settings." },
  ],
};

export default guide;
