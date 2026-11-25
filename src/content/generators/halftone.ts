import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Halftone is the trick printers have used since the late 1800s to reproduce shades with a single ink. A press cannot print grey, only ink or no ink, so the image is broken into a grid of dots: big dots where it should be dark, tiny ones where it should be light. From reading distance the eye blends them into smooth tone. Newspapers, comic books and risograph zines all rely on it, and pop artists blew the dots up until they became the image themselves.",
    "This generator keeps that idea and drops the photo. Instead of a picture, the dots follow a simple tone gradient, so the whole wallpaper becomes a study in dots swelling and shrinking across the screen.",
  ],
  howItWorks: [
    "The screen is covered by a grid at the Grid size, with every other row shifted by half a cell so the dots pack like a real print screen rather than a plain checkerboard. At each grid point the code reads a tone between 0 and 1 from the chosen gradient. Linear rises steadily across the screen in the direction set by Angle. Radial is strongest at a random point near the middle and fades toward the farthest corner. Noise clouds uses seeded fractal noise for soft, patchy shapes. Waves runs sine bands along the Angle direction, bent by a second wave across them, for a rippled look.",
    "The dot radius comes from the square root of that tone, times half the cell and the Max dot size. Using the square root means the area of ink, not the radius, follows the tone, which is how a real halftone screen keeps its shading even. Each dot also gets a tiny random size wobble of up to about six percent, because real printing is never perfectly uniform.",
    "Colour is separate from size. All the dots share one diagonal colour gradient running from Ink (start) in the top left corner to Ink (end) in the bottom right, so a two-colour setting shifts hue across the screen while the tone pattern does its own thing.",
  ],
  settings: [
    { name: "Gradient", text: "Linear, Radial, Noise clouds or Waves. Linear and Radial feel graphic and poster-like; Noise clouds and Waves feel more organic." },
    { name: "Dot shape", text: "Circles, Squares or Diamonds. Squares at 90 degrees give a newsprint grid." },
    { name: "Grid size", text: "The spacing of the dots. Small values look like fine print from a distance; large values make bold pop-art dots." },
    { name: "Max dot size", text: "How big the darkest dots can grow. Above about 0.8 they start to touch and merge into solid ink, the way real halftone shadows fill in." },
    { name: "Angle", text: "The direction of the Linear and Waves gradients. It has no effect on Radial or Noise clouds." },
    { name: "Invert", text: "Swaps big and small dots, so dark becomes light." },
  ],
  bestFor: [
    "On a phone, a Linear gradient with the small dots at the top keeps the clock area clean; use Angle or Invert to get it there. On desktop, Radial and Noise clouds fill wide screens well. Riso print is the default red to navy on warm paper. Pop radial is solid red dots on bright yellow, Noir clouds is white to grey noise on near-black, Ocean waves uses cyan to white diamonds on deep blue, and Newsprint + quote is black square dots on newsprint with the text on.",
    "For dark mode, start from Noir clouds or Ocean waves. The True black (OLED) toggle sets the Paper colour to pure black, which makes the dots look backlit on an OLED screen.",
  ],
  faq: [
    { q: "Why doesn't Angle change anything?", a: "Angle only steers the Linear and Waves gradients. Radial is centred on a point and Noise clouds has no direction, so both ignore it." },
    { q: "Why do my two ink colours not follow the dot sizes?", a: "Colour and size are independent. Size follows the gradient you pick, while colour always runs diagonally from the top left to the bottom right. Set both inks to the same colour for a single-ink print." },
    { q: "Do the dots avoid my text?", a: "Yes. Dots are masked out around the quote so the words sit on clean paper." },
  ],
};

export default guide;
