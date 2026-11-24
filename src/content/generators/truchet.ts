import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Truchet tiles are named after Sebastien Truchet, a French priest and mathematician who in 1704 studied how a single square tile, split diagonally into two colours, could produce many patterns depending on how each copy is rotated. Much later, in the 1980s, Cyril Stanley Smith popularised a version where each tile carries two quarter circle arcs. Placed at random, those arcs join across tile edges into continuous winding paths.",
    "The diagonal version has its own history in computing. A one line program for the Commodore 64, 10 PRINT CHR$(205.5+RND(1)); : GOTO 10, prints random forward and back slashes and fills the screen with a maze. The idea was popular enough to inspire a whole book named after it. This generator offers all three variations: arcs, diagonals and filled triangles.",
  ],
  howItWorks: [
    "The screen is divided into a grid of square tiles of the chosen size, centred so the leftover space is shared evenly at the edges. For each tile the code flips a coin.",
    "In Quarter arcs mode, each tile gets two quarter circles that link the midpoints of its edges. Heads puts them in the top left and bottom right corners; tails puts them in the other two. Because every arc ends at an edge midpoint, it always meets an arc in the neighbouring tile, so the lines flow without breaks into loops and long meandering paths. In Diagonals (10 PRINT) mode, the tile simply gets one diagonal line, leaning one way or the other, and the lines join into a maze of corridors. In Filled triangles mode, one of the four corners is chosen at random and the triangle formed by the other three is filled, giving sharp half square shapes.",
    "All the lines or triangles are painted with a single diagonal gradient that runs across the whole screen from Line (start) at the top left to Line (end) at the bottom right, so the colour flows smoothly regardless of the tile pattern. If you add a quote, the tiles are masked away around it.",
  ],
  settings: [
    { name: "Tile", text: "Quarter arcs, Diagonals (10 PRINT) or Filled triangles. Arcs give soft, flowing curves; diagonals give a classic angular maze; triangles give a bold geometric pattern with no lines." },
    { name: "Tile size", text: "The width of each tile relative to the screen. Small tiles make an intricate texture. Large tiles make a bold pattern where you can follow individual paths." },
    { name: "Line weight", text: "The stroke thickness as a fraction of a tile. Around 0.15 gives clean lines. Near 0.45 the arcs nearly fill their tiles and the background becomes the pattern. It has no effect on filled triangles." },
    { name: "Line (start) and Line (end)", text: "The two ends of the gradient. Set them to the same colour for a flat look, as the 10 PRINT preset does." },
  ],
  bestFor: [
    "Because the pattern is uniform and has no focal point, it fits any screen shape. On a phone, a smaller tile size keeps it as texture; on a large monitor, a bigger tile makes the paths readable from across the room. Mint maze is the default, green to blue arcs on dark grey. 10 PRINT recreates the Commodore 64 blue screen maze with small diagonal tiles. Paper arcs is the light theme choice, navy to red on cream. Bold triangles is loud yellow and orange on black. Dusk + quote adds a short phrase over soft purple and orange arcs.",
    "The True black (OLED) toggle sets the background to pure black, which works especially well with the arcs and diagonal styles since most of the screen is background.",
  ],
  faq: [
    { q: "Why do the arcs never have loose ends?", a: "Every arc starts and ends at the middle of a tile edge, and every edge midpoint is shared with a neighbouring tile that also has an arc there. So every path continues until it closes into a loop or leaves the screen." },
    { q: "What does the seed change?", a: "The coin flip for every tile, and for triangles the corner that is left out. With the same seed and settings you get the same pattern every time." },
    { q: "Why does the colour change across the screen instead of along each path?", a: "The gradient is applied to the whole screen at once, from the top left to the bottom right, so neighbouring tiles always have matching colours." },
  ],
};

export default guide;
