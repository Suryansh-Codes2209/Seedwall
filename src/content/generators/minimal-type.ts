import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Minimal Type is the simplest generator in Seedwall: one background and one quote, set large. It exists for people who want their wallpaper to say something rather than show something. The default line, \"Less, but better.\", is the phrase the designer Dieter Rams used to sum up his approach, and that approach shapes this tool: one idea, a good typeface, and plenty of empty space.",
    "Typographic posters and manifesto prints work the same way. With nothing else on the screen, the choice of font, size and colour carries all of the tone, so a serif can feel literary, a grotesk can feel blunt and a monospace font can feel like a note left in code.",
  ],
  howItWorks: [
    "The background is a single rectangle. With Fill set to Flat it is painted in one Colour. With Linear gradient, it blends from Colour to Second colour along a line that passes through the centre of the screen at the Gradient angle. With Radial gradient, Colour sits in a soft circle a little above centre and blends outward into Second colour toward the corners.",
    "If Film grain is above zero, a layer of fine noise goes over the background. Then the text is laid out. The shared text system measures each quote line in the chosen font and, if the widest line would run past about 84 percent of the screen width, shrinks the whole quote until it fits. It then places the quote at the chosen Position and sets any words wrapped in stars in italics. A paragraph, if you add one, is wrapped into a narrow column in a small sans serif and placed near the quote. Nothing in this generator depends on randomness, so the seed has no effect on the result.",
  ],
  settings: [
    { name: "Fill", text: "Flat, Linear gradient or Radial gradient. Flat is the cleanest and gives the text full attention. Gradients add depth, which helps when the quote is short." },
    { name: "Colour and Second colour", text: "Colour is used everywhere when Fill is Flat; Second colour only appears with a gradient. Keep them in the same family for a gentle shift, or pick contrasting hues for something louder." },
    { name: "Gradient angle", text: "The direction of the linear gradient in degrees. At 90 it runs top to bottom; at 0 it runs left to right. It has no effect on flat or radial fills." },
    { name: "Film grain", text: "Off by default. A small amount gives gradients a printed, slightly analogue texture and prevents visible banding." },
    { name: "Quote line 1, Quote line 2, Paragraph", text: "Your words. Wrap a word in stars, like *better*, to set it in italics. The Paragraph field takes a longer passage, set small in a sans serif." },
    { name: "Font, Text size, Position, Text colour", text: "These do most of the design work here. Choose from Serif, Display, Sans, Grotesk, Mono and Hindi fonts. Large sizes suit two or three word quotes; longer quotes need smaller sizes to avoid cramped wrapping." },
  ],
  bestFor: [
    "On a phone, place the quote in the lower third or bottom left so the clock and notifications stay clear. On a desktop, centre works well because icons usually sit along the edges. Paper is a warm off white for light themes. Ink is near black with white Grotesk text and is the easiest dark mode choice. Sage uses a soft green linear gradient with a serif couplet. Dusk gradient and Electric are more colourful, the second with a radial glow and monospace text.",
    "The True black (OLED) toggle turns the main background colour pure black and lightens the text if needed, which suits OLED phones well since almost every pixel stays off.",
  ],
  faq: [
    { q: "How do I make one word italic?", a: "Wrap it in stars in the quote field, for example \"Stay *soft*.\". Only the starred words change style." },
    { q: "Can I write in Hindi?", a: "Yes. Choose Hindi (Tiro Devanagari) as the Font and type in Devanagari script." },
    { q: "Why does my long quote look small?", a: "Quote lines are not wrapped. If the widest line is too long for the screen, the whole quote is scaled down to fit. Shorten the line or split it across Quote line 1 and Quote line 2 to keep it large." },
  ],
};

export default guide;
