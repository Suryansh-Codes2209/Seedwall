import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Terminal makes a wallpaper that looks like the screen many developers stare at all day: a dark code editor or terminal window, faint syntax coloured code, a command prompt with a block cursor, and a short line of text in front. The default quote is \"// it works on my machine\", the oldest excuse in software.",
    "I built it for people who like their desktop to feel like their workspace, without the noise of real code. The code in the background is deliberately dimmed so it reads as texture, and the presets borrow the colour schemes of well known editor themes so the wallpaper can match the one you already use.",
  ],
  howItWorks: [
    "If Window chrome is on, the code draws a rounded window inset from the screen edges, with a title bar line and the three red, yellow and green dots familiar from macOS. With it off, the code fills the whole screen edge to edge, which gives a full screen console look.",
    "The background code is assembled line by line. Each line is picked at random from a small set of short TypeScript snippets, such as an async function, a loop, or a cache lookup. Line numbers run down the left, starting from a random number. About one line in eight is left blank, and each line gets a random indent, so the block looks like real, uneven code. A simple highlighter colours keywords like const, return and await in the Keywords colour, quoted strings in the Strings colour, and comments at reduced opacity. The whole block is then faded to the Code visibility level, and cut away behind your quote so the text stays clean.",
    "At the bottom sits the prompt line: a small arrow in the Strings colour, your Prompt line text, and if Cursor is on, a solid block cursor placed right after the last character. Your quote is drawn in front of everything, in the Mono font by default.",
  ],
  settings: [
    { name: "Window chrome", text: "Turn it off for an edge to edge console, as in Green phosphor. Leave it on for the look of a floating editor window." },
    { name: "Code visibility", text: "The opacity of the background code, from 0 to 0.5. Around 0.2 keeps it as texture. Raise it if you want the code to be legible; set it to 0 for a blank editor with only the prompt and quote." },
    { name: "Prompt line", text: "Free text, up to 80 characters, shown at the bottom. Put your own path, command or a short note here." },
    { name: "Cursor", text: "Shows or hides the block cursor after the prompt. It is a static block, since wallpapers do not animate." },
    { name: "Background, Text, Keywords, Strings", text: "The four editor colours. Keep Keywords and Strings distinct from each other so the highlighting is visible even at low code visibility." },
  ],
  bestFor: [
    "The code is laid out in rows from the top of the window down, so it suits wide desktop monitors and laptops best, where you see long lines. On a phone, the lines get cut off at the right edge, which still reads fine as texture. GitHub dark is the default. Dracula and Solarized use the colours of those popular editor themes. Green phosphor recalls a monochrome CRT terminal with green text and no window. Paper light is the option for light mode users.",
    "The True black (OLED) toggle sets the background to pure black and lifts any text colour that would be too dark to read, which works well with Green phosphor on an OLED laptop or phone.",
  ],
  faq: [
    { q: "Is the code in the background real?", a: "It is made from a fixed set of short, plausible TypeScript lines picked at random. It is not from any real project and is not meant to run." },
    { q: "Can I change the code that appears?", a: "Not the code lines themselves. You can change the prompt line, the colours, the visibility, and the seed, which reshuffles which lines appear and how they are indented." },
    { q: "Why is the code so faint?", a: "Code visibility defaults to 0.24 so the background stays quiet behind icons and the quote. Raise it if you want more contrast." },
  ],
};

export default guide;
