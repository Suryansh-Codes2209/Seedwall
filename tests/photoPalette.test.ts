import { describe, expect, it } from "vitest";
import { GENERATORS, getGenerator, resolveParams } from "@/generators";
import { contrastRatio, ensureContrast, luminance } from "@/generators/shared/color";
import { extractPalette, mapPaletteToParams } from "@/lib/photoPalette";
import type { PhotoPixels } from "@/lib/paintPhoto";

/** A photo made of horizontal bands of solid colour, with the given share of rows each. */
function bands(colors: [number, number, number, number][], w = 60, h = 60): PhotoPixels {
  const data = new Uint8ClampedArray(w * h * 4);
  const total = colors.reduce((a, c) => a + c[3], 0);
  let y = 0;
  for (const [r, g, b, share] of colors) {
    const rows = Math.round((share / total) * h);
    for (let yy = y; yy < Math.min(h, y + rows); yy++)
      for (let x = 0; x < w; x++) data.set([r, g, b, 255], (yy * w + x) * 4);
    y += rows;
  }
  return { width: w, height: h, data };
}

const hexOf = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

describe("contrast", () => {
  it("matches WCAG for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("nudges ink until it reads at 4.5:1, and leaves good ink alone", () => {
    expect(ensureContrast("#ffffff", "#101418", 4.5)).toBe("#ffffff");
    for (const [fg, bg] of [["#334455", "#223344"], ["#eeeeee", "#ffffff"], ["#777777", "#787878"], ["#ff0000", "#00ff00"]] as const)
      expect(contrastRatio(ensureContrast(fg, bg, 4.5), bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

describe("palette extraction", () => {
  it("finds the main colours of a photo, most common first", () => {
    const pal = extractPalette(bands([[10, 20, 40, 5], [240, 200, 60, 3], [200, 40, 50, 2]]), 6);
    expect(pal.length).toBe(3);
    expect(pal.map((c) => c.hex)).toEqual([hexOf(10, 20, 40), hexOf(240, 200, 60), hexOf(200, 40, 50)]);
    expect(pal[0]!.weight).toBeGreaterThan(pal[1]!.weight);
    expect(pal.reduce((a, c) => a + c.weight, 0)).toBeCloseTo(1, 5);
  });

  it("returns up to k colours for a busy photo, and is deterministic", () => {
    const w = 80, h = 80;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set([(x * 3) % 256, (y * 3) % 256, ((x + y) * 5) % 256, 255], (y * w + x) * 4);
    const px = { width: w, height: h, data };
    const a = extractPalette(px, 6);
    expect(a.length).toBe(6);
    expect(new Set(a.map((c) => c.hex)).size).toBe(6);
    expect(extractPalette(px, 6)).toEqual(a);
  });

  it("ignores transparent pixels", () => {
    const px = bands([[250, 250, 250, 1], [20, 120, 60, 1]]);
    for (let i = 0; i < px.data.length / 2; i += 4) px.data[i + 3] = 0;
    expect(extractPalette(px, 6).map((c) => c.hex)).toEqual([hexOf(20, 120, 60)]);
  });

  it("is empty for a fully transparent image", () => {
    expect(extractPalette({ width: 2, height: 2, data: new Uint8ClampedArray(16) }, 6)).toEqual([]);
  });
});

describe("mapping a palette onto a look", () => {
  const pal = [
    { hex: "#1b2a3a", weight: 0.4 },
    { hex: "#f2e3c6", weight: 0.25 },
    { hex: "#d9822b", weight: 0.15 },
    { hex: "#5d8aa8", weight: 0.12 },
    { hex: "#7a1f2b", weight: 0.08 },
  ];

  it("gives a dark look the darkest colour as background", () => {
    const gen = getGenerator("terminal")!;
    const p = mapPaletteToParams(gen, resolveParams(gen, gen.presets[0]?.id), pal);
    expect(p.bg).toBe("#1b2a3a");
    expect(p.fg).toBe("#f2e3c6");
  });

  it("gives a light look the lightest colour as background", () => {
    const gen = getGenerator("cutting-mat")!;
    const base = resolveParams(gen, gen.presets[0]?.id, { bg: "#f4efe6" });
    const p = mapPaletteToParams(gen, base, pal);
    expect(p.bg).toBe("#f2e3c6");
    expect(p.ink).toBe("#1b2a3a");
  });

  it("spreads the other colours over the accents", () => {
    const gen = getGenerator("mesh-gradient")!;
    const p = mapPaletteToParams(gen, resolveParams(gen, gen.presets[0]?.id, { bg: "#000000" }), pal);
    const accents = [p.c1, p.c2, p.c3, p.c4];
    expect(accents).not.toContain("#1b2a3a");
    expect(new Set(accents).size).toBe(4);
  });

  it("keeps the text readable (4.5:1) on every look, even with a flat palette", () => {
    const flat = [{ hex: "#808080", weight: 0.6 }, { hex: "#8a8a8a", weight: 0.4 }];
    for (const gen of GENERATORS)
      for (const palette of [pal, flat]) {
        const p = mapPaletteToParams(gen, resolveParams(gen, gen.presets[0]?.id), palette);
        const bgKey = Object.entries(gen.params).find(([, d]) => d.kind === "color" && d.role === "bg")![0];
        expect(contrastRatio(String(p["text.color"]), String(p[bgKey])), gen.id).toBeGreaterThanOrEqual(4.5);
      }
  });

  it("only touches colour params that have a role, and leaves everything else alone", () => {
    const gen = getGenerator("geometric")!;
    const base = resolveParams(gen, gen.presets[0]?.id);
    const p = mapPaletteToParams(gen, base, pal);
    for (const [k, d] of Object.entries(gen.params)) if (d.kind !== "color") expect(p[k], k).toBe(base[k]);
    expect(p.seed).toBe(base.seed);
  });

  it("does nothing with an empty palette", () => {
    const gen = getGenerator("aurora")!;
    const base = resolveParams(gen, gen.presets[0]?.id);
    expect(mapPaletteToParams(gen, base, [])).toEqual(base);
  });

  it("orders several backgrounds from the look's tone outwards", () => {
    const gen = getGenerator("landscape")!; // sky1 and near are both backgrounds
    const dark = resolveParams(gen, gen.presets[0]?.id, { sky1: "#0d0221" });
    const light = resolveParams(gen, gen.presets[0]?.id, { sky1: "#f7d9c4" });
    const d = mapPaletteToParams(gen, dark, pal);
    const l = mapPaletteToParams(gen, light, pal);
    expect(d.sky1).toBe("#1b2a3a");
    expect(luminance(String(d.sky1))).toBeLessThan(luminance(String(d.near)));
    expect(l.sky1).toBe("#f2e3c6");
    expect(luminance(String(l.sky1))).toBeGreaterThan(luminance(String(l.near)));
  });
});
