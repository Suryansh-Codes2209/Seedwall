import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Flow Field is one of the classic techniques of generative art. Imagine the screen covered in invisible arrows, each pointing a slightly different way, with neighbouring arrows always similar. Drop a pen anywhere and let it follow the arrows, and it traces a smooth, wandering curve. Do that a thousand times and the curves gather into currents, eddies and combed strands, like wind maps, iron filings, or brushed silk.",
  ],
  howItWorks: [
    "The arrows come from smooth noise, a seeded fractal noise built from three layers of detail. At any point, the noise value is turned into an angle: multiplied by a full turn and then by the Curl setting. Low curl gives gentle drifts; high curl makes the angle change quickly across the screen, so the lines whirl and loop. Noise scale decides how many swirls fit across the screen. The field is measured relative to the shorter side of the screen, so its features keep the same proportion on a phone and on a monitor.",
    "Each line starts at a random point. It takes small, equal steps, each one in the direction the field points at its current position, for a number of steps set by Line length with up to 50 percent random variation either way. If it walks off the edge, it stops early. Every line is randomly assigned to one of the three colours, and the three groups are drawn with rising opacity, so Colour 3 sits slightly on top.",
    "The lines do not avoid each other. Where the field funnels toward the same place, many lines run together and form bright, dense streams; where it spreads out, the canvas stays open. That clustering is what gives the image its sense of current. If you show a quote, the lines are masked out around it.",
  ],
  settings: [
    { name: "Lines", text: "From 100 to 2,400. A few hundred gives an airy sketch; the top of the range fills the screen and makes the streams glow." },
    { name: "Line length", text: "How many steps each line takes. Short lines look like grass, fur or rain; long lines become flowing threads that cross the whole screen." },
    { name: "Noise scale", text: "How busy the field is. Low values make one or two big sweeps; high values break it into many small swirls." },
    { name: "Curl", text: "How strongly the noise is turned into rotation. Around 1 to 1.5 gives smooth flow; above 2.5 the lines start curling into tight loops." },
    { name: "Line weight", text: "Stroke thickness. Thin lines with a high Lines count read like silk; thick lines with fewer lines read like brush marks." },
  ],
  bestFor: [
    "Flow fields have no focal point and no hard shapes, so they sit well behind both desktop icons and phone widgets. Ember is the default warm orange and teal on near-black. Ocean current uses blues with a higher curl for rolling water. Ink on paper is a light option, dense fine black lines with one red. Neon silk uses many long, thin lines with low curl for a smooth, combed look in pink and cyan, and Moss + quote shows the text on a deep green.",
    "On OLED screens, use True black (OLED) for a pure black background. Thin lines on black can look sparse on a small phone, so consider raising Line weight a little.",
  ],
  faq: [
    { q: "Why do the lines bunch together in some places?", a: "Lines follow the field and nothing stops them overlapping. Where the field converges, many lines end up on the same path and form dense streams." },
    { q: "Will the same seed look the same on my phone and my laptop?", a: "Similar in character, not identical. The field scales with the screen's short side, but the start points spread across a different shape, so the exact arrangement changes." },
    { q: "Why do some lines stop short?", a: "A line ends as soon as it leaves the screen, so lines that start near an edge and flow outward are cut short." },
  ],
};

export default guide;
