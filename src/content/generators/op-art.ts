import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Op Art, short for optical art, was a 1960s movement built on the idea that a flat painting could seem to move, swell or vibrate. Artists such as Bridget Riley and Victor Vasarely used strict black and white stripes, checkerboards and grids, then distorted them so the eye read depth and motion that was not there. Vasarely's checkerboards that bulge outward like a sphere are some of the best known examples.",
    "This generator works in that spirit. It starts with a perfectly regular pattern of stripes or checks and pushes it around invisible spheres, so parts of a still wallpaper appear to bulge out of the screen or sink into it.",
  ],
  howItWorks: [
    "The pattern is first laid out flat and centred on the screen, rotated to the chosen angle. Stripes are drawn as long bands, alternating with the background. Checks are drawn as squares, every other cell filled, like a chessboard.",
    "Next the code places a few invisible circles, the bulges, at random positions with random sizes. Every point of the pattern is moved before it is drawn. If the point lies inside a bulge, it is pushed away from that circle's centre, strongly near the middle and fading smoothly to nothing at the rim. Points outside every bulge stay where they are, so the warp blends seamlessly into the flat pattern. About one bulge in five is turned into a pinch instead, which pulls the pattern inward and reads as a dent.",
    "To keep the warped edges smooth, each stripe is sampled at many points along its length, and each check square is split into small segments on every side before being moved. If Accent every Nth band is above zero, every Nth stripe or every Nth filled check is painted in the Accent colour instead of Ink. A quote, if added, cuts a clear space out of the pattern.",
  ],
  settings: [
    { name: "Pattern", text: "Stripes or Checks. Stripes give a smoother, rippling surface. Checks show the curvature more clearly, because every square visibly stretches." },
    { name: "Density", text: "How many bands fit across the screen. Higher density gives a stronger optical buzz but can shimmer on low resolution displays." },
    { name: "Angle", text: "Rotates the pattern in five degree steps. Vertical stripes at 90 degrees, as in Night stripes, and diagonals at 45 both work well." },
    { name: "Bulges", text: "How many invisible spheres distort the pattern, from 0 to 5. At 0 you get a plain, unwarped pattern. Two or three gives a clear focal point." },
    { name: "Strength", text: "How far points are pushed. Near 1 the bulges look like domes; around 0.5 they read as gentle swells." },
    { name: "Accent every Nth band", text: "Recolours every Nth stripe or check in the Accent colour. At 0 there is no accent. Small numbers like 3 to 5 add rhythm without breaking the illusion." },
  ],
  bestFor: [
    "The effect is strongest at larger sizes, so it suits desktops and tablets, though a phone in portrait also works because the bulges are placed in proportion to the screen. Swell is the default: near black stripes on cream around three bulges. Checker dome is the closest to classic 1960s work. Night stripes inverts to white on near black and is good for dark mode. Signal red and Warped tiles use strong colour.",
    "The True black (OLED) toggle sets the background to pure black. With dark patterns like Night stripes, half the screen becomes true black.",
  ],
  faq: [
    { q: "Why does the image seem to move when I look at it?", a: "High contrast patterns with closely spaced edges, especially when curved, cause the eye to perceive flicker and depth. That is the core effect Op Art artists explored, and it is stronger at higher Density." },
    { q: "Some bulges look like dents. Is that a bug?", a: "No. Roughly one bulge in five is deliberately a pinch, which pulls the pattern inward. Try another seed if you want only outward bulges." },
    { q: "Can it be too intense for a wallpaper?", a: "It can. Lower the Density, reduce Strength, or choose fewer bulges for a calmer result that still has depth." },
  ],
};

export default guide;
