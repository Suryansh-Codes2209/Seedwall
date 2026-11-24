import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "A strange attractor is what you see when a chaotic system is left running. Take a single point, push it through the same small rule again and again, and mark where it lands each time. The point never settles down and never retraces its steps exactly, yet the marks pile up into a definite shape with filaments, folds and dense ridges.",
    "This generator uses the Clifford attractor, a well known two-line map from the world of mathematical art. Each new x comes from the sine of a times y plus c times the cosine of a times x, and each new y from the sine of b times x plus d times the cosine of b times y. Those four numbers, a, b, c and d, are the whole design.",
  ],
  howItWorks: [
    "The point starts somewhere near the middle, chosen by the seed. The first 60 steps are thrown away so the point has time to fall onto the attractor, then the code records every position for as many steps as the Points setting asks for. Alongside each position it stores how far the point jumped on that step, which I call its speed.",
    "Once all the points exist, the shape is measured and scaled to fill 84 percent of the screen. If turning it on its side would fill the screen noticeably better, which is usually the case on a phone, it is rotated 90 degrees. Points are sorted into three groups by speed relative to the fastest jump: slow, medium and fast. Each group gets its own colour and a slightly stronger opacity than the one before, so the regions where the point lingers and the regions it races through read differently.",
    "One technical detail: the sine and cosine are computed with basic arithmetic rather than the browser's built-in functions. Chaotic systems magnify tiny rounding differences, and built-in trig can differ in the last digit between machines. Doing it by hand means the preview and the downloaded file are the same picture.",
  ],
  settings: [
    { name: "a, b, c, d", text: "The four coefficients, each from -2.5 to 2.5. Small moves are best: change one value by 0.05 at a time and watch the shape morph. Some combinations collapse into a handful of dots or a simple loop." },
    { name: "Points", text: "How many steps are drawn, from 6,000 to 44,000. More points fill in the faint outer filaments and make the dense areas glow. Fewer points give a sparse, stippled look." },
    { name: "Point size", text: "The dot diameter. Small dots keep fine structure crisp; larger dots merge into soft ribbons, which works well with a low Points count." },
    { name: "Slow points, Medium points, Fast points", text: "The three speed colours. Using one dark and two bright colours makes the speed structure obvious." },
  ],
  bestFor: [
    "Because the shape rotates itself to fit, the same settings work on a tall phone and a wide monitor without leaving huge empty margins. Ribbon is the default, a twisting band in cyan, magenta and cream. Wings opens out into two symmetric lobes, Shell curls into a spiral, Knot is tight and dense, and Graphite (light) draws in pencil greys with a single red for the fastest points.",
    "On OLED screens the dark presets already sit on near-black, and the True black (OLED) toggle makes the background pure black so only the points emit light.",
  ],
  faq: [
    { q: "Why does changing the seed barely change the picture?", a: "The seed only picks the starting point. After the first 60 discarded steps, almost any start lands on the same attractor, so the shape stays the same and only the exact dots shift. To get a new shape, change a, b, c or d." },
    { q: "I moved a slider and the drawing turned into a few dots. Is it broken?", a: "No. For some coefficient values the map settles into a fixed point or a short cycle instead of chaos, so every step lands on the same few spots. Move the value slightly and the full shape usually comes back." },
    { q: "What do the three colours mean?", a: "They show how far the point jumped on each step compared with its fastest jump. Slow points cluster where the map barely moves the point; fast points mark the long leaps between regions." },
  ],
};

export default guide;
