import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Kintsugi is the Japanese practice of repairing broken pottery with lacquer mixed with powdered gold. Instead of hiding the damage, the repair traces every crack in a bright line, so the history of the bowl becomes its most noticeable feature. It is often linked to the idea of accepting imperfection and wear as part of an object's life.",
    "This generator paints a single glazed surface and breaks it. Every seed produces a different fracture, and the cracks are drawn as gold seams that are thick where the break began and fade to hairlines at their tips. There is no picture of a bowl, only the surface and its repair, which keeps it quiet enough to sit behind app icons.",
  ],
  howItWorks: [
    "First the code picks where the surface broke. With Off centre it chooses one impact point somewhere in the middle area of the screen. With From an edge it picks a point along one of the four sides. With Twice it uses two impact points, so two crack systems overlap.",
    "From each impact point, a set of main cracks shoots outward at roughly even angles, with a little random variation. Each crack is grown step by step. At most steps the direction changes only slightly, but about one step in four makes a sharper turn, which gives the jagged, kinked look of real fractures rather than smooth curves. As a crack grows it can split off a side branch at an angle. Branches are thinner than their parent, shorter, and can branch again, up to three levels deep and sixty seams in total.",
    "Each seam is then drawn in short chunks so its width can taper: full weight near the start, thinning toward the end. Wider parts get a second, narrower stroke on top in a lighter version of the gold, which reads as a glint of light on raised metal. A small gold disc covers each impact point, as if the shards met there. Optional grain is laid over everything to give the glaze some texture.",
  ],
  settings: [
    { name: "Cracks", text: "How many main cracks leave each impact point, from 2 to 14. Three or four gives a clean, sparse break; ten or more starts to look shattered." },
    { name: "Branching", text: "The chance that a crack splits as it grows. At 0 every crack is a single line. Raise it to fill empty areas with finer secondary cracks." },
    { name: "Wander", text: "How much each crack changes direction. Low values give nearly straight lines, as in the Hairline preset. High values make cracks zigzag and curl." },
    { name: "Seam weight", text: "The starting thickness of the gold. Thin seams look delicate and suit dark glazes; heavier seams read better on pale glazes and at small sizes." },
    { name: "Where it broke", text: "Off centre, From an edge, or Twice. From an edge is useful if you want one side of the screen left calm for icons or text." },
    { name: "Grain", text: "A little grain makes the glaze feel like fired ceramic rather than a flat fill." },
  ],
  bestFor: [
    "The design is mostly empty surface with lines through it, so it works on both phones and desktops without crowding icons or windows. Raku, the default, is a near black glaze with warm gold and is the strongest dark mode choice. Hairline is even more minimal, with three thin cracks on near black and no grain. Indigo uses more cracks and heavier branching on deep blue.",
    "For light themes, Porcelain puts a double break on an off white glaze, and Celadon uses a soft green glaze with a crack system entering from an edge. If you use an OLED phone, the True black (OLED) toggle replaces the glaze with pure black, and the gold stays bright against it.",
  ],
  faq: [
    { q: "Why do some seams have a lighter line inside them?", a: "That is the glint. It is only drawn on parts of a seam that are wide enough, so it shows near the start of thick cracks and disappears on thin branches." },
    { q: "Is there a text overlay?", a: "Text is off by default, but you can turn it on. The default line is \"Broken, then golden.\" The cracks are masked out behind the text box so the quote stays readable." },
    { q: "How do I get a very different break with the same settings?", a: "Change the seed. It decides the impact position, the starting angle of the cracks, every kink and every branch, so two seeds with identical settings can look completely unrelated." },
  ],
};

export default guide;
