import type { Generator, ParamSchema, Preset } from "./types";
import { backgroundParams, liftForBlack, type BackgroundParams } from "./shared/background";
import { hexToRgb, mix } from "./shared/color";
import { pick, range } from "./shared/rng";
import { blurFilter, esc, grainFilter, grainRect, n, rect, svgDoc, unit } from "./shared/svg";
import { clearZonesMask, layoutText, textParams, type Box, type TextParams } from "./shared/text";

type P = TextParams & BackgroundParams & {
  bg: string;
  c1: string;
  c2: string;
  c3: string;
  star: string;
  shape: string;
  clouds: number;
  scale: number;
  dust: boolean;
  core: boolean;
  stars: number;
  grain: number;
  seed: number;
};

const params: ParamSchema<P> = {
  bg: { kind: "color", label: "Space", default: "#06040f", group: "Colours", role: "bg" },
  c1: { kind: "color", label: "Gas 1", default: "#6a2bd9", group: "Colours", role: "accent" },
  c2: { kind: "color", label: "Gas 2", default: "#e0459b", group: "Colours", role: "accent" },
  c3: { kind: "color", label: "Gas 3", default: "#3f8cff", group: "Colours", role: "accent" },
  star: { kind: "color", label: "Stars", default: "#fff4e8", group: "Colours", role: "fg" },
  shape: {
    kind: "select",
    label: "Shape",
    options: [
      { value: "cloud", label: "Cloud" },
      { value: "band", label: "Band across the sky" },
      { value: "drift", label: "Drifting off the edge" },
    ],
    default: "cloud",
    group: "Nebula",
  },
  clouds: { kind: "range", label: "Gas", min: 0, max: 1, step: 0.05, default: 0.7, group: "Nebula", help: "How much glowing gas there is." },
  scale: { kind: "range", label: "Cloud size", min: 0.5, max: 2.5, step: 0.05, default: 1, group: "Nebula" },
  dust: { kind: "toggle", label: "Dark dust lanes", default: true, group: "Nebula" },
  core: { kind: "toggle", label: "Bright core", default: true, group: "Nebula" },
  stars: { kind: "range", label: "Stars", min: 0, max: 3, step: 0.1, default: 1, group: "Stars" },
  grain: { kind: "range", label: "Film grain", min: 0, max: 0.3, step: 0.01, default: 0.04, group: "Stars" },
  seed: { kind: "seed", label: "Seed", default: 7 },
  ...backgroundParams(),
  ...textParams({ "text.none": true, "text.line1": "Look *further*.", "text.line2": "", "text.font": "display", "text.size": 7, "text.position": "lower", "text.color": "#f4ecff" }),
};

const presets: Preset<P>[] = [
  { id: "violet", title: "Violet", params: {} },
  { id: "veil", title: "Teal veil", params: { bg: "#020a0f", c1: "#0f8f9c", c2: "#5fe0c8", c3: "#2a5bd7", star: "#e8f6ff", shape: "drift", clouds: 0.75, scale: 1.3, core: false, seed: 19 } },
  { id: "ember", title: "Ember", params: { bg: "#0a0503", c1: "#c2401c", c2: "#f29a3a", c3: "#7a1f3d", star: "#fff1dc", clouds: 0.8, scale: 0.9, seed: 4 } },
  { id: "milky-way", title: "Milky Way", params: { bg: "#04050b", c1: "#6d5a7e", c2: "#d9b48c", c3: "#3e5c8f", star: "#ffffff", shape: "band", clouds: 0.55, scale: 1.1, stars: 2.2, core: false, seed: 12 } },
  { id: "oled-quote", title: "Black + quote", params: { c1: "#3d2bd9", c2: "#ff4fa3", c3: "#1fb6ff", shape: "drift", clouds: 0.6, stars: 1.4, seed: 23, "background.trueBlack": true, "text.none": false } },
];

/** feColorMatrix that turns turbulence into one flat colour whose alpha follows the noise. */
function tintMatrix(hex: string, gain: number, cut: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `0 0 0 0 ${n(r / 255)} 0 0 0 0 ${n(g / 255)} 0 0 0 0 ${n(b / 255)} ${n(gain)} 0 0 0 ${n(-cut)}`;
}

/** Shrinks a text zone check to "does this circle touch any zone". */
const touches = (zones: Box[], x: number, y: number, r: number): boolean =>
  zones.some((z) => x + r > z.x && x - r < z.x + z.w && y + r > z.y && y - r < z.y + z.h);

export const nebula: Generator<P> = {
  id: "nebula",
  name: "Nebula",
  description: "Glowing clouds of gas in deep space, with a starfield of small and bright stars and an optional bright core. Works on tall phones and wide monitors alike.",
  params,
  presets,
  trueBlack: { native: true },
  render(p, size, rng) {
    const { w, h } = size;
    const u = unit(size);
    const black = p["background.trueBlack"];
    const bg = black ? "#000000" : p.bg;
    const grain = black ? 0 : p.grain;
    const text = layoutText(black ? { ...p, "text.color": liftForBlack(p["text.color"], 4.5) } : p, size);
    const defs: string[] = [];
    const body: string[] = [rect(0, 0, w, h, `fill="${esc(bg)}"`)];

    // The nebula's body: soft blobs strung along a path that follows the long side of the screen.
    const landscape = w >= h;
    const along = (t: number, ax: number, ay: number, bx: number, by: number): [number, number] => [ax + (bx - ax) * t, ay + (by - ay) * t];
    let a: [number, number], b: [number, number];
    if (p.shape === "band") {
      // A band from one edge to the other, tilted a little.
      const tilt = range(rng, -0.25, 0.25);
      a = landscape ? [-0.1 * w, h * (0.5 + tilt)] : [w * (0.5 + tilt), -0.1 * h];
      b = landscape ? [1.1 * w, h * (0.5 - tilt)] : [w * (0.5 - tilt), 1.1 * h];
    } else if (p.shape === "drift") {
      // Enters from one corner and fades out towards the middle.
      const flip = rng() < 0.5;
      a = [flip ? 1.05 * w : -0.05 * w, range(rng, -0.05, 0.25) * h];
      b = [w * range(rng, 0.4, 0.6), h * range(rng, 0.55, 0.75)];
    } else {
      const cx = w * range(rng, 0.38, 0.62), cy = h * range(rng, 0.38, 0.6);
      // Lie roughly along the long side, so a phone gets a tall cloud and a monitor a wide one.
      const ang = (landscape ? 0 : Math.PI / 2) + range(rng, -0.6, 0.6);
      const len = 0.28 * Math.max(w, h);
      a = [cx - Math.cos(ang) * len, cy - Math.sin(ang) * len];
      b = [cx + Math.cos(ang) * len, cy + Math.sin(ang) * len];
    }
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sizeU = 30 * p.scale;
    const count = Math.max(6, Math.ceil(length / (sizeU * u * 0.45)));
    const blobs: string[] = [];
    const bend = p.shape === "band" ? 0 : range(rng, -0.12, 0.12) * length;
    const nx = -(b[1] - a[1]) / (length || 1), ny = (b[0] - a[0]) / (length || 1);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const [x0, y0] = along(t, a[0], a[1], b[0], b[1]);
      const off = Math.sin(t * Math.PI) * bend + range(rng, -0.7, 0.7) * sizeU * u;
      const x = x0 + nx * off, y = y0 + ny * off;
      // Middle of the path is fuller than the ends.
      const fullness = p.shape === "band" ? 1 : 0.55 + 0.45 * Math.sin(t * Math.PI);
      const r = sizeU * u * range(rng, 0.45, 1.2) * fullness;
      blobs.push(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * range(rng, 1, 1.6))}" ry="${n(r)}" transform="rotate(${n(range(rng, 0, 180))} ${n(x)} ${n(y)})" fill="url(#nb-blob)"/>`);
    }
    defs.push(`<radialGradient id="nb-blob"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.65" stop-color="#fff" stop-opacity="0.3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`);
    const shape = blobs.join("");

    // Soft haze under everything (skipped on true black so space stays #000).
    if (!black) {
      defs.push(`<radialGradient id="nb-sky" cx="${n((a[0] + b[0]) / 2 / w)}" cy="${n((a[1] + b[1]) / 2 / h)}" r="0.8"><stop offset="0" stop-color="${esc(mix(p.bg, p.c1, 0.12))}"/><stop offset="1" stop-color="${esc(p.bg)}" stop-opacity="0"/></radialGradient>`);
      body.push(rect(0, 0, w, h, `fill="url(#nb-sky)"`));
    }

    // Gas: each colour is its own turbulence layer, cut to the body and blurred a touch.
    const amount = p.clouds;
    if (amount > 0) {
      const freq = 1 / (sizeU * u * 0.55);
      defs.push(blurFilter("nb-haze", sizeU * u * 0.6, size));
      body.push(`<g filter="url(#nb-haze)" opacity="${n(0.35 * amount)}"><g fill="${esc(p.c1)}">${shape.replaceAll(`fill="url(#nb-blob)"`, `fill="${esc(p.c1)}" fill-opacity="0.5"`)}</g></g>`);
      // [colour, frequency, alpha gain, alpha cut, noise type]. Gain > 0 shows the noise's bright
      // patches; gain < 0 on "turbulence" noise shows its creases, which read as thin filaments.
      const layers: [string, number, number, number, string][] = [
        [p.c1, freq * 0.8, 2.4, 0.95, "fractalNoise"],
        [p.c3, freq * 1.3, 3, 1.35, "fractalNoise"],
        [p.c2, freq * 0.9, -3.2, -0.95, "turbulence"],
        [mix(p.c2, "#ffffff", 0.45), freq * 1.6, -4, -0.7, "turbulence"],
      ];
      layers.forEach(([c, f, gain, cut, type], i) => {
        const id = `nb-gas${i}`;
        defs.push(
          `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">` +
            `<feTurbulence type="${type}" baseFrequency="${Math.round(f * 1e6) / 1e6}" numOctaves="5" seed="${Math.floor(rng() * 9999)}" result="t"/>` +
            `<feColorMatrix in="t" type="matrix" values="${tintMatrix(c, gain, cut - 0.25 * amount)}" result="c"/>` +
            `<feComposite in="c" in2="SourceGraphic" operator="in" result="m"/>` +
            `<feGaussianBlur in="m" stdDeviation="${n((i < 2 ? 0.8 : 0.25) * u)}"/>` +
            `</filter>`,
        );
        body.push(`<g filter="url(#${id})" opacity="${n(Math.min(1, (i < 2 ? 0.55 : 0.4) + 0.45 * amount))}">${shape}</g>`);
      });

      // Dark lanes of dust cut through the glow.
      if (p.dust) {
        const dark = black ? "#000000" : mix(p.bg, "#000000", 0.4);
        defs.push(
          `<filter id="nb-dust" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">` +
            `<feTurbulence type="fractalNoise" baseFrequency="${Math.round(freq * 1.4 * 1e6) / 1e6}" numOctaves="3" seed="${Math.floor(rng() * 9999)}" result="t"/>` +
            `<feColorMatrix in="t" type="matrix" values="${tintMatrix(dark, 4, 2.1)}" result="c"/>` +
            `<feComposite in="c" in2="SourceGraphic" operator="in" result="m"/>` +
            `<feGaussianBlur in="m" stdDeviation="${n(1.2 * u)}"/>` +
            `</filter>`,
        );
        body.push(`<g filter="url(#nb-dust)" opacity="0.75">${shape}</g>`);
      }
    }

    // Stars: count follows the area in units, so a phone and an ultrawide feel equally dense.
    const areaU = (w / u) * (h / u);
    const nStars = Math.round(areaU * 0.03 * p.stars);
    const tints = [p.star, p.star, "#ffffff", "#cfe0ff", "#ffe2bf", mix(p.star, p.c3, 0.4)];
    const small: string[] = [];
    const bright: string[] = [];
    for (let i = 0; i < nStars; i++) {
      const x = rng() * w, y = rng() * h;
      const m = rng() ** 14; // most stars are faint, a few are bright
      const r = (0.06 + 0.4 * m) * u;
      const c = pick(rng, tints);
      const op = n(range(rng, 0.2, 0.7) + 0.3 * m);
      if (m > 0.45 && !touches(text.zones, x, y, r * 10)) {
        bright.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 6)}" fill="url(#nb-glow)" opacity="${n(0.25 + 0.5 * m)}"/>`);
        if (m > 0.8) {
          const s = r * 10, t = r * 0.22;
          bright.push(`<path d="M${n(x - s)} ${n(y)}L${n(x)} ${n(y - t)}L${n(x + s)} ${n(y)}L${n(x)} ${n(y + t)}ZM${n(x)} ${n(y - s)}L${n(x + t)} ${n(y)}L${n(x)} ${n(y + s)}L${n(x - t)} ${n(y)}Z" fill="${esc(c)}" opacity="0.45"/>`);
        }
        bright.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${esc(c)}"/>`);
      } else small.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${esc(c)}" opacity="${op}"/>`);
    }
    // A fine dust of tiny stars, thicker along the gas for the band (like the Milky Way).
    const nDust = Math.round(areaU * 0.07 * p.stars);
    for (let i = 0; i < nDust; i++) {
      let x = rng() * w, y = rng() * h;
      if (p.shape === "band" && i % 2 === 0) {
        const t = rng();
        const spread = (rng() + rng() + rng() - 1.5) * sizeU * u * 0.9;
        x = a[0] + (b[0] - a[0]) * t + nx * spread;
        y = a[1] + (b[1] - a[1]) * t + ny * spread;
      }
      small.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(range(rng, 0.04, 0.1) * u)}" fill="${esc(p.star)}" opacity="${n(range(rng, 0.15, 0.6))}"/>`);
    }
    defs.push(`<radialGradient id="nb-glow"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.12" stop-color="${esc(p.star)}" stop-opacity="0.35"/><stop offset="1" stop-color="${esc(p.star)}" stop-opacity="0"/></radialGradient>`);

    // A bright core where the gas is thickest.
    let core = "";
    if (p.core && amount > 0) {
      const t = p.shape === "drift" ? 0.75 : range(rng, 0.4, 0.6);
      const [x, y] = along(t, a[0], a[1], b[0], b[1]);
      const r = sizeU * u * 0.75;
      defs.push(
        `<radialGradient id="nb-core"><stop offset="0" stop-color="#ffffff"/><stop offset="0.06" stop-color="${esc(mix(p.c2, "#ffffff", 0.75))}" stop-opacity="0.9"/>` +
          `<stop offset="0.3" stop-color="${esc(p.c2)}" stop-opacity="0.35"/><stop offset="1" stop-color="${esc(p.c1)}" stop-opacity="0"/></radialGradient>`,
      );
      core = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#nb-core)"/>`;
    }

    // Keep the quote readable: gas fades softly behind it, stars stay out of it.
    if (text.zones.length) {
      const holes = text.zones.map((z) => `<rect x="${n(z.x)}" y="${n(z.y)}" width="${n(z.w)}" height="${n(z.h)}" rx="${n(4 * u)}" fill="#000" fill-opacity="0.8"/>`).join("");
      defs.push(blurFilter("nb-soft", 4 * u, size));
      defs.push(`<mask id="nb-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#fff"/><g filter="url(#nb-soft)">${holes}</g></mask>`);
      defs.push(clearZonesMask("nb-zones", size, text.zones));
    }
    const gas = body.slice(1).join("") + core;
    if (grain > 0) defs.push(grainFilter("nb-grain", grain));

    return svgDoc(
      size,
      defs.join(""),
      body[0] +
        (text.zones.length ? `<g mask="url(#nb-fade)">${gas}</g>` : gas) +
        `<g${text.zones.length ? ` mask="url(#nb-zones)"` : ""}>${small.join("")}${bright.join("")}</g>` +
        (grain > 0 ? grainRect(size, "nb-grain") : "") +
        text.svg,
    );
  },
};
