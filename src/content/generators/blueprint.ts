import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Blueprint recreates the look of an engineering drawing sheet: fine pale lines on deep blue paper, part outlines with centre lines, dimension arrows, numbered balloons and a title block in the corner. The name comes from the cyanotype process used to copy technical drawings from the late 1800s onward. Light passing through a drawing on tracing paper turned the treated sheet Prussian blue everywhere except under the lines, which stayed white.",
    "Later copying methods reversed this into whiteprints, blue lines on a pale sheet, and that is one of the presets too.",
  ],
  howItWorks: [
    "First the paper gets its grid. Fine lines run at one fifth of the Grid size, and every fifth line is drawn heavier, like the major and minor rulings on graph paper. Next come the parts: rectangles whose sizes and positions snap to the major grid. About six in ten get a circle in the middle, like a bore or a boss, and every part gets dash-dot centre lines that run a little past its edges, the way a draughtsman marks the axes of symmetry.",
    "Dimension lines are placed next, a little over half horizontal and the rest vertical. Each has short extension ticks at both ends, solid arrowheads, and a number above or beside it. Callouts are thin leader lines from a small dot to a circled number, counting up from 1. If the title block is on, it sits in the bottom right corner with your Drawing title in capitals, a SCALE 1:1 and UNITS MM line, and SHEET 01. All lettering uses a monospaced font.",
    "If you show a quote, the parts, dimensions and callouts are masked out behind it so the words are not crossed by lines. The grid itself keeps running underneath, the way a real sheet would.",
  ],
  settings: [
    { name: "Grid size", text: "The spacing of the major grid, which also controls the size steps that parts and dimensions snap to. Small values give dense graph paper; large values feel more like a sketch on a drafting board." },
    { name: "Parts", text: "How many outlined components, from 0 to 8. Set it to 0 for a sheet of pure annotation, or raise it for an assembly drawing look." },
    { name: "Dimension lines", text: "From 0 to 14. These add the most technical character, so lower them first if the sheet feels cluttered behind your icons." },
    { name: "Callouts", text: "Numbered balloons, from 0 to 10." },
    { name: "Title block and Drawing title", text: "Shows or hides the corner box. The title takes up to 40 characters and is always shown in capitals; a project name or a version number works well." },
  ],
  bestFor: [
    "On desktop, the title block in the bottom right corner behaves like a real drawing sheet, and the Dense spec sheet preset fills a wide monitor with detail. On a phone, fewer parts and callouts keep the home screen readable; Cyanotype and Classic blueprint are good starting points. Midnight is a darker navy with brighter blue ink, and Whiteprint flips the scheme to blue lines on pale grey with the title ASSEMBLY / SHEET 2.",
    "The True black (OLED) toggle makes the Paper pure black, which turns the sheet into a glowing line drawing. It looks best with a bright ink such as the Midnight preset's light blue.",
  ],
  faq: [
    { q: "Do the dimension numbers mean anything?", a: "They are the length of each dimension line in the generator's own layout units, halved and shown to one decimal. Within a single wallpaper a longer line always has a larger number, but they are not real millimetres." },
    { q: "Can I change the text in the title block?", a: "The Drawing title field is yours, up to 40 characters. The SCALE 1:1, UNITS MM and SHEET 01 labels are fixed." },
    { q: "Why does the grid show through behind my quote?", a: "Only the parts and annotations are cleared around the text. Leaving the grid makes the quote feel written on the sheet rather than pasted over a hole in it." },
  ],
};

export default guide;
