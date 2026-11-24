import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "A topographic map shows the height of land with contour lines: each line joins points at the same elevation, so where lines bunch together the ground is steep, and where they spread apart it is flat. Survey maps also make every fifth line heavier, called an index contour, so you can count elevation at a glance. Over time the look of these maps, fine concentric loops on a pale ground, became a popular graphic pattern in its own right.",
    "This generator makes an imaginary terrain and maps it. There are no real places in it, but the lines behave the way contour lines on a real survey map do.",
  ],
  howItWorks: [
    "First the code builds a height field. It covers the screen with a grid and, at each grid point, samples layered noise: a smooth random function added to smaller, fainter copies of itself at higher frequencies. The large layer creates hills and valleys, and the smaller layers add ridges and bumps. The Terrain scale setting decides how much of that noise fits on the screen.",
    "Next it chooses evenly spaced heights between the lowest and highest likely values, as many as the Contour levels setting allows. For each height it runs marching squares, a method that walks through every grid cell, checks which corners are above or below that height, and draws the short segment where the line must cross. Joined together, those segments form the contour lines. Hilltops become nested rings, and slopes become bands of parallel lines.",
    "Every fifth contour is treated as an index line: it is drawn twice as thick and, if Two-tone index lines is on, in the Index line colour. Ordinary lines are slightly transparent so the index lines stand out. If there is a quote, the lines are masked away behind it so the text sits on clear ground.",
  ],
  settings: [
    { name: "Contour levels", text: "How many elevation steps are drawn, from 6 to 40. Fewer levels give open, airy maps. More levels pack lines tightly and give a rich, engraved look, as in Sand." },
    { name: "Terrain scale", text: "How much terrain fits on the screen. Low values zoom in on one or two large hills. High values zoom out to many small peaks." },
    { name: "Line weight", text: "The thickness of ordinary lines. Index lines are always twice this. Thin lines suit high levels; thicker lines suit fewer levels and small screens." },
    { name: "Two-tone index lines", text: "Colours every fifth line in the Index line colour. Turn it off, as Moss does, for a single colour map where index lines differ only in weight." },
    { name: "Background, Line colour, Index line colour", text: "The map colours. A warm paper background with dark lines recalls printed maps; a dark background with bright lines feels like a screen or a blueprint." },
  ],
  bestFor: [
    "Contour patterns have no fixed orientation or focal point, so they crop well to any screen shape and sit comfortably behind icons on phones and desktops. Survey map is the default, dark lines with red index lines on paper, and it comes with a quote. Sand is a dense, warm light variant. For dark mode, try Night ridge with slate lines and amber index lines, or Cyan terrain on deep navy. Moss is a green, mid dark option.",
    "The True black (OLED) toggle sets the background to pure black and lightens the line colours if they would be too dark, which leaves only the thin contours lit on an OLED screen.",
  ],
  faq: [
    { q: "Is this a map of a real place?", a: "No. The terrain is made from seeded noise, so every seed gives a new imaginary landscape." },
    { q: "Why are some lines thicker?", a: "Every fifth contour is an index line, following the convention on survey maps. It is drawn at twice the weight and, with two-tone on, in a second colour." },
    { q: "Why do lines stop around my quote?", a: "The contours are masked out in a padded box around the text so the words stay readable." },
  ],
};

export default guide;
