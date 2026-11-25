import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Trinetra means \"three eyed\", a name of Shiva. Devotees of Shiva mark the forehead with the tripundra, three horizontal lines of sacred ash, or bhasma. Between them, in images of Shiva, sits the third eye. In the best known story, Kama, the god of desire, disturbed Shiva's meditation, and the third eye opened and burned him to ash. The closed eye stands for inward stillness, and the open eye for a fire that destroys illusion and desire.",
    "This generator frames the forehead so closely that only the ash and the eye remain. A single setting moves between the two states, from a closed eye in meditation to an open eye full of fire. The default quote, \"एक दृष्टि, और सब भस्म।\", reads \"one glance, and all is ash\".",
  ],
  howItWorks: [
    "The three bands of ash are not solid stripes. Each one is built from about a hundred and fifty thin streaks, as if drawn by a finger: streaks cluster toward the middle of the band, start and end at slightly different points so the ends look frayed, wobble a little along their length, and fade toward the band's edges. A faint wide stroke underneath holds each band together from a distance. Grain over the top gives the ash a powdery texture.",
    "The eye is a vertical almond that spans all three bands. Its height is fixed by the bands, and the Eye open setting controls its width, from a thin slit to a wide opening. The ash is cut away around the eye so the bands part for it. Inside, the eye holds a fiery iris: a deep dark glow, a radial gradient from the Heart of the fire colour out to Fire, seventy two fine rays, a few faint rings, and a tall central pupil. The outline of the almond is drawn in the Eyelid colour.",
    "Around everything, a soft halo in the Fire colour grows with both Glow and how open the eye is. Embers only appear once the eye is slightly open, and their number scales with the opening. They rise from the top of the eye and drift outward. If there is a quote, the whole forehead scales down and moves into the space the text leaves.",
  ],
  settings: [
    { name: "Eye open", text: "The central control. Near 0 the eye is a closed line, as in Dhyana (closed), and no embers appear. At 1 it is wide open, as in Pralaya." },
    { name: "Ash line length", text: "How far the ash bands reach across the screen. Shorter lines leave more empty background on the sides, which helps on wide monitors." },
    { name: "Embers", text: "The maximum number of rising sparks. The actual count is multiplied by how open the eye is." },
    { name: "Glow", text: "The strength of the fiery halo around the eye and the blurred glow inside the almond. Lower it for a flatter, more graphic image." },
    { name: "Grain", text: "A fine noise texture over the whole image that makes the ash look dusty. Set it to 0 for clean lines." },
  ],
  bestFor: [
    "The bands run horizontally and the eye sits in the middle, so the design works on both phones and desktops; on a phone the bands are made a little longer to use the narrow width. Agni is the default, with a half open fiery eye on near black. Pralaya is fully open with maximum embers. Dhyana (closed) is calm, in cool blue with the eye shut. Bhasma has no embers and a soft glow, the quietest dark option.",
    "Kashi (light) is the preset for light themes, with grey ash and a red eyelid on a pale background. For OLED phones, the True black (OLED) toggle sets the background to pure black and keeps the ash and fire bright.",
  ],
  faq: [
    { q: "Why are there no embers when the eye is nearly closed?", a: "Embers only appear once the eye is slightly open, and their count grows with the opening. A closed eye stands for meditation, so the image stays still." },
    { q: "Does the eye always sit in the centre?", a: "It stays horizontally centred. Vertically, it moves into whatever space the quote leaves free, and the whole forehead shrinks if needed." },
    { q: "What do the preset names mean?", a: "Agni is fire, Dhyana is meditation, Pralaya is the dissolution at the end of a cosmic cycle, Bhasma is sacred ash, and Kashi is the old name of Varanasi, the city most closely tied to Shiva." },
  ],
};

export default guide;
