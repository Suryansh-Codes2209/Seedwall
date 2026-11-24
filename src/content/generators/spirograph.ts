import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "The Spirograph was a drawing toy sold from the 1960s: a toothed wheel with a pen hole rolled inside or around a toothed ring, and the pen traced looping, flower like curves. Mathematically those curves are hypotrochoids (wheel inside the ring) and epitrochoids (wheel outside). This generator draws those two, along with two related families: rose curves, which the Italian mathematician Guido Grandi named rhodonea, and Lissajous figures, the shapes you get on an oscilloscope when two vibrations at different frequencies are combined.",
    "Each of these is a single equation traced with one continuous line. The appeal is how much detail comes from so little: two small whole numbers decide whether you get a simple star or a dense, woven mandala.",
  ],
  howItWorks: [
    "For the two Spirograph modes, the code treats Ring teeth / a as the size of the fixed ring and Wheel teeth / b as the size of the rolling wheel. Pen offset / phase sets how far the pen sits from the wheel's centre. It then traces the path of the pen for as many full turns as it takes the wheel to return to its starting tooth, which depends on how the two numbers divide into each other. For the rose, the radius of the curve rises and falls with a cosine whose frequency is a divided by b. For Lissajous, the horizontal and vertical positions each follow a sine wave, at frequencies a and b, with the pen offset acting as a phase shift between them.",
    "Every curve is then scaled so its farthest point lands on a circle, and that circle is sized by the Size setting relative to the shorter side of the screen. When Layers is above one, extra copies of the curve are drawn with a small, seeded variation: rose curves are rotated and shrunk, Lissajous curves shift phase, and the Spirograph modes use a slightly larger pen offset. Each extra layer is a little more transparent. The lines are stroked with a gradient from Line (start) at the top left to Line (end) at the bottom right. With Glow on, a thicker, blurred copy sits underneath, so the lines look lit.",
  ],
  settings: [
    { name: "Curve", text: "Spirograph (inside), Spirograph (outside), Rose (rhodonea) or Lissajous. Inside curves loop inward to a dense centre; outside curves form rounded gear like shapes." },
    { name: "Ring teeth / a and Wheel teeth / b", text: "The two numbers that define the curve. Pairs that share no common factor, like 13 and 5, give the most loops. Pairs that share factors close up quickly into simpler shapes." },
    { name: "Pen offset / phase", text: "For Spirograph modes, values above 1 put the pen outside the wheel's rim and create inner loops. For Lissajous it rotates the figure as if viewed from a different angle." },
    { name: "Layers", text: "From 1 to 6 overlapping copies. One layer is the cleanest; three or four create a moire like weave." },
    { name: "Glow", text: "Adds a soft halo. It suits dark backgrounds; on light ones, as in Ink lissajous, it is better off." },
  ],
  bestFor: [
    "The curve is centred and round, so it suits square and portrait screens best, and it also works as a centrepiece on a desktop. Golden spiro is the default, yellow to pink on near black. Neon rose and Aurora + quote are bright and suit dark mode. Blueprint gear is a single outside curve in pale blue on navy. Ink lissajous is dark ink on cream for light themes.",
    "The True black (OLED) toggle sets the background to pure black. Since the image is only thin lines, almost the whole screen stays black on an OLED panel.",
  ],
  faq: [
    { q: "Why does the curve sometimes look very simple?", a: "If a and b share a common factor, the wheel returns to its start after fewer turns, so the curve has fewer loops. Try changing one number by one." },
    { q: "Does the seed change the curve?", a: "The first layer is fixed by your settings. The seed only varies the extra layers, so with Layers at 1 every seed gives the same image." },
    { q: "What happens if Wheel teeth is as large as Ring teeth?", a: "For the Spirograph modes, the code quietly uses a wheel one tooth smaller than the ring instead, because a wheel as large as the ring cannot roll inside it. Rose and Lissajous curves use both numbers as they are." },
  ],
};

export default guide;
