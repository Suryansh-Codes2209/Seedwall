import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Cymatics shows the patterns sand makes on a vibrating plate. In the late 1700s the physicist Ernst Chladni scattered sand on thin metal plates and drew a violin bow along the edge. The plate rang at a particular note, and the sand jumped away from the parts that were shaking and gathered along the lines that stayed still. Every note produced its own figure, and these are still called Chladni figures.",
    "What I love about them is that they are both precise and organic. The lines are mathematically exact, but each one is drawn by thousands of individual grains, so the result looks hand-made, like stippling in an old engraving.",
  ],
  howItWorks: [
    "The plate is a square centred on the screen, and its vibration is described by a standard approximation for a square plate: the cosine of n times the horizontal position times the cosine of m times the vertical position, plus Blend times the same expression with m and n swapped. Where that sum is zero, the plate is not moving. Those still places are the nodal lines, and that is where sand ends up. The pattern repeats beyond the plate's edges, so on a wide or tall screen it continues outward rather than stopping at a border.",
    "The sand is placed by trial. The code picks a random spot on the screen and works out how strongly the plate moves there. The closer that value is to zero, the more likely the grain is kept; far from a nodal line, it is almost always thrown away. It keeps trying until it has placed the number of grains you asked for or runs out of attempts. Kept grains are split into three sizes so the lines have some texture.",
    "If Draw nodal lines is on, the code also samples the plate on a fine grid and traces the exact zero contour with a marching squares pass, drawing it as a thin line in the Nodal lines colour under the sand.",
  ],
  settings: [
    { name: "Mode m and Mode n", text: "Two whole numbers from 1 to 14 that pick the note. Higher numbers give more, finer cells. A big gap between the two, like 2 and 9 in Ember, stretches the cells in one direction." },
    { name: "Blend", text: "How the two waves combine, from -1 to 1. The classic Chladni figures are at -1 and 1. Values in between give asymmetric, more unusual patterns." },
    { name: "Plate size", text: "Zooms the pattern. Low values show many repeats of a small figure; high values show one large figure filling the screen." },
    { name: "Grains of sand", text: "From 2,000 to 24,000. More grains make solid, confident lines." },
    { name: "Draw nodal lines", text: "Adds the exact contour lines underneath the sand." },
  ],
  bestFor: [
    "The figure is centred and symmetric, so it suits a phone lock screen with the clock above it, and on desktop a higher Plate size keeps it from becoming a tiled pattern. Brass plate is the default cream sand on near-black. Bone on ink is white on navy, Ember adds orange nodal lines under peach sand, High note uses large mode numbers for a fine green lattice, Chalk (light) draws dark sand on off-white, and With a quote turns the text on.",
    "For OLED, the True black (OLED) toggle makes the plate pure black, leaving only the sand lit.",
  ],
  faq: [
    { q: "Why is my plate covered in evenly spread sand with no pattern?", a: "When Mode m equals Mode n and Blend is -1, the two waves cancel everywhere, so the whole plate counts as still and the sand lands anywhere. Change either mode number or move Blend." },
    { q: "Why does swapping m and n give the same figure?", a: "At Blend 1 or -1 the formula is symmetric in m and n, so swapping them produces the same nodal lines. At other Blend values the swap does change the picture." },
    { q: "Is this a physically exact simulation?", a: "It uses the common textbook approximation for a square plate, which gives the right family of figures. A real plate's edges and material shift the lines a little, so photos of real experiments never look quite this clean." },
  ],
};

export default guide;
