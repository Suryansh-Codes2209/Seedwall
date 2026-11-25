import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Clockwork draws a gear train, the chain of toothed wheels that carries motion through a clock, a watch or any small machine. I wanted every pair here to actually mesh, so the drawing follows the same basic rules a machinist would.",
    "The look borrows from two places: the exposed movement of a mechanical watch, with large spoked wheels and small solid pinions, and the line work of technical drawings, where each gear's pitch circle is shown as a faint dashed ring.",
  ],
  howItWorks: [
    "Everything is sized from one number, the tooth size, which engineers call the module. A gear's pitch radius is the module times its tooth count divided by two, and two gears mesh when their centres are exactly the sum of their pitch radii apart. Tooth counts come from a fixed list between 12 and 60. Each tooth is a trapezoid that reaches one module beyond the pitch circle and dips one and a quarter modules below it, the standard proportions for spur gears. The tooth shape is simplified, though: real gear teeth have curved involute flanks.",
    "The first gear, the driver, has at least 28 teeth, sits near the middle of the screen and is drawn in the Driver colour. Each new gear picks a parent, usually one of the most recently placed, so the train winds across the screen rather than clustering. It is set at a random angle around that parent at the exact meshing distance, then rejected if its centre would land too far off screen or if it would come too close to any other gear. A gear that passes is rotated so that a gap faces the parent's tooth at the point of contact, taking the gear ratio into account.",
    "Wheels with 28 or more teeth get a rim, a hub and five spokes, or six from 48 teeth up, when Spoked wheels is on. Smaller pinions just get a hub and axle. In Line mode the gears are outlines and the dashed pitch circles are shown. In Solid mode the gears are filled and the windows between spokes are cut out with the background colour.",
  ],
  settings: [
    { name: "Gears", text: "How many gears to try to place, from 2 to 24. The code makes a limited number of attempts, so with a big tooth size on a small screen you may get fewer than you asked for." },
    { name: "Tooth size", text: "The module. Small values give fine, watch-like teeth and let many gears fit; large values give chunky industrial wheels." },
    { name: "Drawing", text: "Line or Solid. Line feels like a technical drawing; Solid reads more like brass parts under a loupe." },
    { name: "Spoked wheels", text: "Adds rims and spokes to the larger wheels. Turn it off for plain discs." },
  ],
  bestFor: [
    "Desktop screens show off long trains with many gears, as in Watch movement, which packs 20 small-toothed wheels onto a dark blue dial. On a phone, fewer and larger gears read better among app icons; Two gears is the extreme case, two big white wheels on black. Escapement is the default amber driver on charcoal, Brass (solid) uses filled bronze tones, and Drafting (light) draws dark grey lines with a red driver on cream.",
    "For OLED screens, the True black (OLED) toggle makes the background pure black.",
  ],
  faq: [
    { q: "Would these gears actually turn together?", a: "Each new gear is placed at the exact meshing distance from its parent and rotated so tooth meets gap, and other gears are kept clear of it, so each parent and child pair is set up to mesh. The teeth are simplified trapezoids rather than true involute curves." },
    { q: "Why do I get fewer gears than the slider says?", a: "Placement gives up after a fixed number of attempts. Large gears and a small screen both reduce how many fit, because each new gear must stay mostly on screen and clear of the others. Lower Tooth size or try another seed." },
    { q: "Does the quote cover the gears?", a: "Gears are masked out behind the quote, so the text sits in a clean gap. The quote is off by default; turn off No text to show it." },
  ],
};

export default guide;
