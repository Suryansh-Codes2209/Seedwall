import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Geometric fills the screen with a grid of simple shapes in a limited palette. The default mix is a nod to the Bauhaus, the German design school of the 1920s whose posters, textiles and teaching exercises reduced everything to circles, squares and triangles in a few strong colours. You will also recognise the idea in modern tile patterns, quilt blocks and brand illustration systems.",
    "Each tile is very basic on its own: a quarter circle, a half disc, a triangle. The interest comes from neighbours. A quarter circle next to a half disc next to a ring creates curves and rhythms that seem to cross tile boundaries.",
  ],
  howItWorks: [
    "For the square shape modes, the screen is divided into a grid of tiles at the Tile size and centred, so partial tiles at the edges are even on both sides. In Mixed (Bauhaus), each tile has a one in four chance of a solid coloured square behind it, then gets one shape picked from six: a quarter circle, a half circle, a full circle, a right triangle, a square with a dot in the middle, or a ring. The shape is rotated by 0, 90, 180 or 270 degrees, and every colour is picked from the palette at random.",
    "Circles mode uses only round shapes, with full circles twice as likely as rings or half circles. Triangles mode fills every tile with a solid square and then lays a triangle in another randomly picked colour across one half, which produces the half-square triangle patterns familiar from patchwork quilts. Hexagons mode switches to offset rows of hexagons, and about three in ten get a smaller hexagon inside in another colour.",
    "Before any colour is used, the palette is filtered: any colour exactly matching the Background is removed. The Bauhaus palette includes a cream that matches the default background, so without this step some shapes would vanish into the paper.",
  ],
  settings: [
    { name: "Palette", text: "Choose from the built-in palettes (Sunset, Ocean, Bauhaus, Forest, Mono, Candy, Ember, Electric) or one of the editor theme palettes, marked '(theme)', such as Dracula, Nord or Gruvbox." },
    { name: "Background", text: "Shows through the gaps and behind shapes that do not fill their tile. Picking one of the palette's own colours removes it from the tiles." },
    { name: "Shapes", text: "Mixed (Bauhaus), Circles, Triangles or Hexagons. Triangles is the busiest because every tile is fully filled; Circles leaves the most background visible." },
    { name: "Tile size", text: "From 4 to 30. Small tiles read as texture from a distance; large tiles become bold graphic shapes you can count." },
    { name: "Gap", text: "Space between tiles. At 0 the shapes touch and form continuous patterns; a small gap gives a crisp mosaic look." },
  ],
  bestFor: [
    "Geometric is busy by nature, so on a phone a larger Tile size keeps the home screen calm, or turn the quote on and let the tiles frame it. On a big desktop monitor, smaller tiles make a rich, rug-like texture. Bauhaus is the default red, teal, yellow and navy on cream. Ocean circles puts round shapes in blues on dark navy, Candy triangles uses soft pastels on white, Ember hex sets small hexagons with gaps on a deep red-black, and Forest + quote shows the text over greens on a warm cream.",
    "This look does not offer the True black (OLED) toggle. For a dark version, set Background to #000000 and pick a bright palette. The editor theme palettes work well because they hold only accent colours; Electric also glows on black, though its darkest shade is nearly black and those tiles will almost disappear.",
  ],
  faq: [
    { q: "Why are there no cream shapes in the Bauhaus palette?", a: "Any palette colour that exactly matches the Background is dropped. On the default cream background that removes the cream, so every shape stands out." },
    { q: "Do the tiles avoid my text?", a: "Yes. The tiles are cleared away in a padded box around the quote, so the words sit on plain background." },
    { q: "Why are shapes at the screen edges cut off?", a: "The grid uses whole tiles centred on the screen, so the outer row and column usually run slightly past the edges." },
  ],
};

export default guide;
