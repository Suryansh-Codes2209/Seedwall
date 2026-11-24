import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Aurora is my attempt at the feeling of standing under the northern lights: soft curtains of colour drifting across a dark sky, brighter in the middle and fading at the edges, with stars showing through. It is not a physical simulation of charged particles hitting the upper atmosphere. It is closer to a long-exposure photograph, where the light has smeared into smooth, glowing ribbons.",
    "Real aurorae are mostly green from oxygen, with pinks, reds and violets at the fringes. The default colours lean into that, a mint green, a blue and a violet.",
  ],
  howItWorks: [
    "Each band starts as a gently wavy line across the screen. The code picks a resting height somewhere between 15 and 70 percent of the way down, a wave height, a wave count, a starting phase and a slight tilt, so one band can climb from left to right while another dips. Seven points along that line are joined with smooth curves, the line is extended a little past both edges so nothing ends abruptly, and then it is copied downward by a random thickness and closed into a ribbon.",
    "Every ribbon is filled with a vertical gradient that starts transparent at the top edge, peaks at 90 percent strength a little under halfway down, and fades back to nothing at the bottom. That is what gives each band its soft core instead of a hard outline. The ribbons cycle through Light 1, Light 2 and Light 3 in order, each with its own random opacity, and then the whole group is blurred together by the Softness amount so overlapping bands blend where they cross.",
    "Underneath the ribbons sit 160 small white stars of varying size and brightness. On top of everything, an optional film grain layer adds fine noise. Grain helps break up the smooth gradients, which can otherwise show visible steps on some screens.",
  ],
  settings: [
    { name: "Bands", text: "How many ribbons, from 2 to 7. Two or three gives a calm sky with lots of darkness; six or seven fills the frame and the colours start mixing into new shades where they overlap." },
    { name: "Softness", text: "The blur radius. Low values keep visible ribbon shapes and wave edges. High values melt everything into a hazy glow, which suits a background behind icons." },
    { name: "Film grain", text: "Adds photographic noise. A little, around 0.05 to 0.12, looks natural. Push it past 0.25 for a deliberately gritty, analogue look." },
    { name: "Sky, Light 1, Light 2, Light 3", text: "Sky is the background. The three lights are assigned to bands in turn, so with more than three bands a colour repeats." },
  ],
  bestFor: [
    "Aurora is one of the safest choices for a phone home screen: there are no hard edges or details to fight with app icons, and the dark sky keeps it easy on the eyes at night. It works equally well on a wide monitor, where the ribbons have more room to wave. Start with Borealis for the classic green and violet, Solar wind for hot pinks and amber, or Glacier for three slow, very soft icy bands. Night + quote switches the text on, and Dawn (light) flips the idea into a pale pink morning sky with no stars.",
    "For OLED screens, the True black (OLED) toggle turns the Sky colour to pure black so only the ribbons and stars light up.",
  ],
  faq: [
    { q: "Why does my sky look stripy or banded?", a: "Very smooth gradients can show visible steps on some displays and after image compression. Raising Film grain slightly breaks those steps up. A higher Softness can also help." },
    { q: "Can I make it look like a real aurora photo?", a: "Get close by using greens for two lights and a pink or violet for the third, keeping Bands at three or four and Softness around 6 to 9. It will still be stylised: real aurorae have fine vertical rays, which this does not draw." },
    { q: "The stars look odd on my light background. Can I change their colour?", a: "The stars are always white. On a light sky, switch Stars off, as the Dawn (light) preset does." },
  ],
};

export default guide;
