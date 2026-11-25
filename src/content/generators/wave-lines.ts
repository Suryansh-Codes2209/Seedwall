import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Wave Lines draws a stack of horizontal lines that rise into a ridge of peaks in the middle, each line hiding the ones behind it. Most people know the look from the cover of Joy Division's 1979 album Unknown Pleasures, designed by Peter Saville. That image came from a plot of radio signals from the pulsar CP 1919, with each line showing one pulse, stacked so that the whole reads like a mountain range seen in profile.",
    "The same idea, called a ridgeline or joy plot, is now used in data visualisation to compare many distributions. Here it is used purely as a pattern. The default hidden quote is \"UNKNOWN PLEASURES\", a nod to the source.",
  ],
  howItWorks: [
    "The lines are spaced evenly between about one sixth from the top of the screen and one eighth from the bottom, with margins on the left and right. Each line is sampled at ninety points across. At every point, the height comes from three parts. A bell shaped envelope, centred near the middle of the screen, decides where peaks are allowed: tall in the centre, flat at the sides. Inside that envelope, layered noise sets how tall each peak is, using its absolute value so the line only rises and never dips. A much smaller, faster noise adds a fine ripple everywhere, even at the flat edges.",
    "Each line uses its own slice of the noise, so neighbouring lines are similar but not identical, which is what makes the stack read as a coherent landscape. The points are joined with a smooth curve.",
    "When Hide lines behind peaks is on, the code also fills the area just below each line with the background colour before stroking it. Lines are drawn from top to bottom, so each lower line's fill covers the parts of the lines above it that would otherwise show through. That is what creates the illusion of depth. All lines are stroked with one vertical gradient from Line (top) to Line (bottom).",
  ],
  settings: [
    { name: "Lines", text: "How many lines are stacked, from 12 to 140. Fewer lines show each ridge clearly; more lines give a dense, fabric like surface." },
    { name: "Amplitude", text: "How tall the peaks rise. High values make dramatic spikes that overlap several lines above; low values give a gentle swell, as in Calm water." },
    { name: "Peak width", text: "The width of the bell shaped envelope. Low values confine the peaks to a narrow central strip, like the album cover. At 1 the whole width is active, as in Terrain slice." },
    { name: "Roughness", text: "How many bumps appear across each line. Low values give smooth humps; high values give jagged, signal like spikes." },
    { name: "Hide lines behind peaks", text: "Turns the depth effect on or off. With it off, all lines show through each other, which reads more like a waveform than a landscape." },
    { name: "Line weight", text: "The stroke thickness. Keep it thin when there are many lines so they do not merge." },
  ],
  bestFor: [
    "The ridge sits in the centre with empty margins around it, so it works as a striking phone lock screen and as a calm desktop background. Pulsar is the default, white lines on near black, closest to the original cover. Sunset gradient uses orange to pink strokes. Signal (quote) has narrow, tall peaks and a short quote. Terrain slice is the light theme choice, dark lines on paper. Calm water turns off occlusion for soft, low ripples in blue.",
    "The True black (OLED) toggle sets the background to pure black. Because the occluding fills use the background colour, they become black as well, so the depth effect stays intact on OLED screens.",
  ],
  faq: [
    { q: "Is this the actual pulsar data from the album cover?", a: "No. The shapes come from seeded noise inside a bell shaped envelope. It recreates the look, not the original measurements." },
    { q: "Why do the peaks sometimes cover the lines above them?", a: "With Hide lines behind peaks on, each line is backed by a strip of background colour, so a tall peak covers whatever is behind it, just as a near mountain hides a far one." },
    { q: "Why are the lines flat near the edges?", a: "The bell shaped envelope fades the peaks out toward the sides. Raise Peak width to spread the activity across more of the screen." },
  ],
};

export default guide;
