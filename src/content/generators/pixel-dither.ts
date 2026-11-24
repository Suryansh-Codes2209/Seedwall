import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Early computers and game consoles could show only a handful of colours at once, so artists faked the in between shades with dithering: placing pixels of two colours in a fine checkered mix so that, from a normal viewing distance, the eye blends them into a third tone. Ordered dithering, which uses a fixed grid of thresholds called a Bayer matrix, produces a recognisable crosshatched texture that is now shorthand for retro games, old Macintosh graphics and green screen handhelds.",
    "Pixel Dither uses that same technique on purpose. It draws a smooth gradient between two, three or four colours, but builds it entirely from chunky pixels in those exact colours, with no blending at all.",
  ],
  howItWorks: [
    "The gradient is divided into segments, one between each pair of neighbouring colours. Each segment is then split into sixteen thin bands. A 4 by 4 Bayer matrix assigns each of its sixteen cells a threshold from 0 to 15, arranged so that turning cells on in order spreads them as evenly as possible. In the first band of a segment no cells use the second colour; in the next band one cell does, then two, and so on, until the band is fully the second colour. That sequence of patterns is what makes a gradient appear out of only flat colours.",
    "Each band is a shape across the screen whose orientation follows the Direction setting. For Top to bottom, Left to right and Diagonal, the bands are straight strips at the matching angle. For Radial, they are rings around a centre point that the seed places somewhere in the middle area of the screen. The pixel pattern inside each band is repeated as a tile, and its pixel size is scaled to the screen and rounded to whole pixels so the grid stays crisp.",
  ],
  settings: [
    { name: "Colours used", text: "Two, three or four. It takes Colour 1 first, then Colour 2, and so on. Two colours give a pure duotone; four give a longer, more varied ramp." },
    { name: "Colour 1 to Colour 4", text: "The gradient runs in this order. Colour 1 is at the start of the direction (top, left, or the centre for radial). Ordering them from dark to light gives the most natural ramp." },
    { name: "Direction", text: "Top to bottom, Left to right, Diagonal or Radial. Radial is the only one where the seed changes the image, because it decides the centre point." },
    { name: "Pixel size", text: "How large each dither pixel is, relative to the screen. Small values look like a fine halftone. Large values, like 1.2 in Handheld green, give the obvious chunky look." },
  ],
  bestFor: [
    "Dithered gradients have a strong texture but no shapes, so they work behind icons on both phones and desktops. On a high density phone screen, raise Pixel size so the pattern stays visible instead of blurring into a smooth gradient. Synth sunset is the default, a four colour purple to yellow ramp. Handheld green uses four greens in the style of early handheld consoles, with a quote turned on. Amber CRT is a three colour horizontal ramp in monitor amber with a \"> READY.\" prompt. Ice uses three cold blues on a diagonal, and Duotone radial is a two colour ring pattern.",
    "There is no True black (OLED) toggle on this generator, but if you set Colour 1 to pure black, that end of the gradient will be true black on OLED screens.",
  ],
  faq: [
    { q: "Why does the gradient look smooth on my phone?", a: "At small pixel sizes on a sharp display, the dots are too small to see and your eye blends them, which is what dithering was designed for. Increase Pixel size to bring the texture back." },
    { q: "Why are only sixteen steps used between colours?", a: "A 4 by 4 Bayer matrix has sixteen cells, so it can express sixteen mixes between two colours. That limit is part of the retro look." },
    { q: "Does changing the seed do anything?", a: "Only for the Radial direction, where it moves the centre of the rings. The straight directions always look the same for the same colours and settings." },
    { q: "What font suits it?", a: "The default text uses the Mono (JetBrains) font, which fits the computer terminal feel of the presets." },
  ],
};

export default guide;
