import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Circuit Board draws the top layer of a printed circuit board: copper traces running in straight lines and 45 degree bends, round pads where they start, vias and square pads where they stop, and a few chips sitting on the board with their pins sticking out. Board designers route traces at 45 degrees rather than sharp right angles, and that angular, tidy routing is what makes a PCB instantly recognisable even from across a room.",
    "The part I care most about is the quote. Instead of printing text on top of the traces, the router treats your words like a component and routes around them, so the copper flows past the text the way it would flow around a connector on a real board.",
  ],
  howItWorks: [
    "The screen is divided into a square grid at the Pitch spacing, and every grid point starts out free. The first thing the code does is mark every point under your quote as taken, so nothing can be routed there. Then it places the chips: dark rounded rectangles with pins along their top and bottom edges, each surrounded by a one-cell keep-out border that is also marked as taken.",
    "Each trace is a small random walk. It starts at a free grid point, picks one of eight directions, and steps forward one cell at a time. On each step there is roughly a one in five chance it turns 45 degrees left or right. It stops when it hits the edge, runs into a point another trace or chip already owns, or reaches its own length limit of somewhere between 6 and 40 steps. Every point it passes through is claimed, which is why traces never cross or overlap.",
    "Straight runs are merged into single segments so the lines stay clean. The start of every trace gets a solid copper pad. The end gets either a hollow ring, like a via drilled through the board, or a small square pad, chosen at random.",
  ],
  settings: [
    { name: "Pitch", text: "The grid spacing, which sets the scale of everything: trace width, pad size and the length of a step. Low values look like a dense modern board; high values look like a chunky hobby board you could solder by hand." },
    { name: "Traces", text: "How many traces the router attempts, from 20 to 400. Attempts that start on an occupied point are skipped, so past a certain number the board simply fills up rather than getting messier." },
    { name: "Chips", text: "From 0 to 8. Chips claim a lot of space, so with a small Pitch and many chips they become the main shapes on the board and traces snake between them." },
  ],
  bestFor: [
    "The default text is on and set in a monospaced font, so this works well as a desktop wallpaper with a short line of code or a motto routed around. On a phone, a smaller Pitch keeps the traces fine enough not to compete with app icons. Classic PCB is the familiar green and gold, Matte black + gold is a darker, premium version, Blue silkscreen uses pale traces on navy with no text, and Dense (no text) packs in more traces and chips at a fine pitch. Gamer purple swaps the quote for a joke command and runs violet copper on a deep purple board.",
    "For OLED phones, the True black (OLED) toggle sets the Board to pure black. Matte black + gold is already close to that and is the natural starting point.",
  ],
  faq: [
    { q: "Is this a real working circuit?", a: "No. The traces are random walks with real routing rules (no crossings, 45 degree turns, keep-out around chips), but they do not connect components in any meaningful electrical way." },
    { q: "Will the traces run through my quote?", a: "No. The text area is blocked before any trace is routed, so copper always goes around the words." },
    { q: "Why doesn't raising Traces make the board much denser?", a: "Because traces cannot share grid points. Once the free space is used up, extra attempts land on taken points and are skipped. To get a denser look, lower the Pitch instead." },
  ],
};

export default guide;
