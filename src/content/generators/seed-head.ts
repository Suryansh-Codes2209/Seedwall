import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Look closely at the middle of a sunflower and you will see seeds arranged in two sets of spirals, one turning clockwise and one counterclockwise. Count them and you usually get neighbouring Fibonacci numbers, such as 21 and 34 or 34 and 55. The arrangement is called phyllotaxis, and it comes from a simple growth rule: each new seed forms at a fixed turn from the previous one, and that turn is very close to the golden angle, about 137.5 degrees.",
    "Seed Head reproduces that rule directly. It places thousands of dots one after another, each turned by the golden angle from the last, and the familiar spirals appear without being drawn.",
  ],
  howItWorks: [
    "The code uses the well known model by Helmut Vogel. Seed number one sits closest to the centre. Each following seed is rotated by the chosen angle and placed a little further out, with its distance proportional to the square root of its number. That square root keeps the seeds evenly packed, so the head neither crowds in the middle nor thins at the edges. The spacing is chosen so that the last seed reaches the farthest corner of the screen, which means the pattern always fills the frame at any aspect ratio.",
    "Seeds grow larger toward the rim, like a real flower head. Their colour shifts from the Centre colour to the Edge colour in twelve gentle steps, giving visible rings. If Highlight spirals is set, the code picks three spiral arms and paints those seeds in the Highlight colour. It works because seeds whose numbers share the same remainder when divided by 13, 21, 34 or 55 all lie on one spiral, which is the Fibonacci connection made visible.",
    "The Centre setting moves the origin of the head. Bottom edge puts it just below the screen so the pattern rises like a half flower. Corner puts it near the lower left. Seeds that would land outside the screen are skipped.",
  ],
  settings: [
    { name: "Seeds", text: "How many seeds are placed, from 300 to 4000. More seeds make each one smaller and the spirals finer." },
    { name: "Turn between seeds", text: "The rotation between consecutive seeds, in degrees. At 137.51 the seeds pack perfectly. Move it by a fraction of a degree and gaps open into curved or straight spokes, which is what the Off by a hair preset shows at 137.3." },
    { name: "Seed size", text: "Scales every dot. Larger seeds touch and form a solid texture; smaller ones leave more background showing." },
    { name: "Highlight spirals", text: "None, 13, 21, 34 or 55. The number decides which family of spirals gets highlighted. Lower numbers give broad, sweeping arms; higher numbers give tight, many armed swirls." },
    { name: "Centre", text: "Centre, Bottom edge or Corner. The off centre options leave more space at the top for a clock or quote." },
    { name: "Background, Centre, Edge, Highlight", text: "The four colours. Keep Highlight clearly brighter than both Centre and Edge so the spiral arms read." },
  ],
  bestFor: [
    "The centred version suits square and portrait screens, where the round head fits naturally. For phones, Rising (bottom) puts the head below the screen edge, leaving the top calm for the clock. Corner bloom works well on wide desktop monitors. Sunflower is the default, warm orange and green on near black. Paper (light) uses a cream background for light themes.",
    "The True black (OLED) toggle replaces the background with pure black, which makes the seeds look like they glow and leaves every gap between them unlit on an OLED panel.",
  ],
  faq: [
    { q: "Why do I see spirals when the code never draws any?", a: "Your eye connects nearby seeds. Because each seed is turned by the golden angle, neighbours line up along curves whose counts are Fibonacci numbers." },
    { q: "Why do straight lines or gaps appear when I change the angle?", a: "The golden angle is the turn that avoids lining seeds up with each other. Any other angle eventually repeats near alignments, which shows up as spokes and holes." },
    { q: "What does the seed control?", a: "The overall starting rotation of the head and which three spiral arms are highlighted. The structure itself always follows the same rule." },
  ],
};

export default guide;
