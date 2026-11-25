import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Code City is a night skyline where the lit windows are arranged like lines of source code. Squint and the buildings look like ordinary office towers after dark; look closer and each floor is an indented row of short coloured blocks, the way a syntax-highlighted file looks when you zoom out in an editor's minimap.",
    "The colours come from popular editor themes. The default pulls from GitHub's dark palette, and the presets borrow from Dracula and Tokyo Night, plus an amber monochrome that recalls old phosphor terminals. It is a wallpaper for people who spend their evenings in a code editor and like the idea of the city doing the same.",
  ],
  howItWorks: [
    "The sky is a vertical gradient from Sky top to Sky horizon. If Stars is on, 140 small white stars are scattered across the upper half. If Moon is on, a pale disc with a soft halo sits high on the right.",
    "The city is built in two rows. The back row uses about four fifths as many buildings, is allowed to be a little taller, and is coloured halfway toward the horizon so it reads as distant haze. The front row uses the full Buildings count and the Buildings colour. Building widths vary around an average set by how many fit across the screen, heights fall anywhere between about a third of the Skyline height and the full value, and roughly one building in four gets a thin antenna on the roof.",
    "Only the front row gets windows. With Windows as code on, each floor either stays dark or becomes one line of code: an indent of zero to two character widths, then one to three tokens of different lengths, each painted in Window 1, 2 or 3 at a slightly random brightness. With it off, the floors are filled with an even grid of small square windows, each lit or dark at random according to Lit windows.",
  ],
  settings: [
    { name: "Buildings", text: "From 6 to 40. This is how many front-row buildings share the width, so higher values make narrower towers and more columns of code." },
    { name: "Skyline height", text: "How far up the screen the tallest buildings can reach. Keep it under about 0.5 on a phone if you want a clear sky for the clock and widgets." },
    { name: "Lit windows", text: "How busy the city is. In code mode there is a built-in floor, so even at 0 about one floor in five still shows a line of code; in grid mode, 0 means a fully dark city." },
    { name: "Windows as code", text: "Switches between code rows and classic square windows. Amber terminal turns it off for a more traditional skyline." },
  ],
  bestFor: [
    "The skyline sits at the bottom with open sky above, which suits a phone lock screen where the clock lives at the top. The default quote, a small mono 'while (city.sleeps) { ship(); }' in the upper third, fits in that sky. On a wide desktop the code rows have room to stretch, and Tokyo night, with a denser and taller skyline and no text, makes a good full-width background. GitHub night is the default, Dracula uses that theme's pink, green and yellow, and Sunset skyline swaps night for a purple to peach dusk with no stars.",
    "This look does not have the True black (OLED) toggle, because the sky is a gradient. For an OLED-friendly version, set Sky top and Buildings to black and Sky horizon to a very dark colour.",
  ],
  faq: [
    { q: "Is that real code in the windows?", a: "No, it is the shape of code rather than actual text: indents and coloured token blocks of random lengths. It reads like a zoomed-out editor, not something you can copy." },
    { q: "Why are there still lit windows when Lit windows is at zero?", a: "In code mode each floor has a small base chance of showing a line so the city never goes completely dark. Turn off Windows as code if you want a fully dark skyline at zero." },
    { q: "What colour is the moon?", a: "It is Window 3 blended mostly toward white, so it always matches the palette. Change Window 3 to shift its tint." },
  ],
};

export default guide;
