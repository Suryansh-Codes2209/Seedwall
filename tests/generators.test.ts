import { describe, expect, it } from "vitest";
import { XMLValidator } from "fast-xml-parser";
import { DEVICES } from "@/config/devices";
import { GENERATORS, renderWallpaper, resolveParams } from "@/generators";
import { coerceParam } from "@/generators/render";
import { TRUE_BLACK, TRUE_BLACK_HELP, TRUE_BLACK_LABEL, applyTrueBlack, contrastOnBlack, liftForBlack } from "@/generators/shared/background";

const SIZES = [...DEVICES.map((d) => ({ id: d.id, w: d.w, h: d.h })), { id: "tiny", w: 320, h: 240 }, { id: "tall", w: 400, h: 1600 }];

describe.each(GENERATORS.map((g) => [g.id, g] as const))("%s", (_id, gen) => {
  it("has metadata, a seed param, text params and ≥4 presets", () => {
    expect(gen.name).toBeTruthy();
    expect(gen.description.length).toBeGreaterThan(20);
    expect(gen.params.seed?.kind).toBe("seed");
    expect(gen.params["text.none"]?.kind).toBe("toggle");
    expect(gen.presets.length).toBeGreaterThanOrEqual(4);
    expect(new Set(gen.presets.map((p) => p.id)).size).toBe(gen.presets.length);
  });

  it("presets only use valid param keys and values", () => {
    for (const preset of gen.presets)
      for (const [key, value] of Object.entries(preset.params)) {
        const def = gen.params[key];
        expect(def, `${preset.id}.${key}`).toBeDefined();
        if (def) expect(coerceParam(def, value), `${preset.id}.${key}=${String(value)}`).toBe(value);
      }
  });

  it.each(SIZES.map((s) => [s.id, s] as const))("renders valid SVG at %s", (_d, s) => {
    const svg = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id), s);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${s.w} ${s.h}"`);
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    expect(XMLValidator.validate(svg)).toBe(true);
  });

  it("renders every preset, with and without text", () => {
    for (const preset of gen.presets)
      for (const none of [false, true]) {
        const svg = renderWallpaper(gen, resolveParams(gen, preset.id, { "text.none": none }), { w: 1200, h: 800 });
        expect(XMLValidator.validate(svg), `${preset.id} text.none=${none}`).toBe(true);
        expect(svg).not.toMatch(/NaN|undefined/);
      }
  });

  it("is deterministic for a fixed seed", () => {
    const p = resolveParams(gen, gen.presets[0]?.id, { seed: 1234 });
    const a = renderWallpaper(gen, p, { w: 1920, h: 1080 });
    const b = renderWallpaper(gen, { ...p }, { w: 1920, h: 1080 });
    expect(a).toBe(b);
  });

  it("escapes user text", () => {
    const svg = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id, { "text.none": false, "text.line1": `<b>&"x"</b>` }), { w: 1600, h: 1000 });
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).not.toContain("<b>");
  });
});

describe("seed sensitivity", () => {
  it.each(["cutting-mat", "mesh-gradient", "topographic", "blueprint", "terminal", "geometric", "aurora", "flow-field", "wave-lines", "landscape", "truchet", "git-graph", "circuit", "halftone", "spirograph", "code-city", "marble", "contributions", "event-horizon", "cymatics", "attractor", "quasicrystal", "op-art", "seed-head", "trinetra", "jyotirlinga", "sudarshan", "padmanabha", "dhruva", "kintsugi", "ascent", "clockwork", "impasto", "nebula", "frutiger-aero"])("%s changes with the seed", (id) => {
    const gen = GENERATORS.find((g) => g.id === id)!;
    const a = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id, { seed: 1 }), { w: 1600, h: 1000 });
    const b = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id, { seed: 2 }), { w: 1600, h: 1000 });
    expect(a).not.toBe(b);
  });
});

describe("true black (OLED)", () => {
  const supported = GENERATORS.filter((g) => g.trueBlack);

  it("is offered by most dark-friendly generators", () => {
    expect(supported.length).toBeGreaterThanOrEqual(20);
  });

  it("metadata and schema agree: the toggle exists exactly where trueBlack is declared", () => {
    for (const g of GENERATORS) {
      const def = g.params[TRUE_BLACK];
      expect(Boolean(def), g.id).toBe(Boolean(g.trueBlack));
      if (!def) continue;
      expect(def.kind, g.id).toBe("toggle");
      expect(def.default, g.id).toBe(false);
      expect(def.label).toBe(TRUE_BLACK_LABEL);
      expect(def.help).toBe(TRUE_BLACK_HELP);
      expect(Boolean(g.trueBlack?.native) !== Boolean(g.trueBlack?.bg?.length), `${g.id}: either native or bg keys`).toBe(true);
      for (const k of g.trueBlack?.bg ?? []) expect(g.params[k]?.kind, `${g.id}.${k}`).toBe("color");
    }
  });

  it.each(supported.map((g) => [g.id, g] as const))("%s: off renders exactly as before, on paints #000000", (_id, gen) => {
    for (const preset of gen.presets) {
      const base = resolveParams(gen, preset.id, { [TRUE_BLACK]: false });
      const { [TRUE_BLACK]: _omit, ...without } = base;
      const size = { w: 900, h: 600 };
      expect(renderWallpaper(gen, base, size), preset.id).toBe(renderWallpaper(gen, without, size));
      const on = renderWallpaper(gen, resolveParams(gen, preset.id, { [TRUE_BLACK]: true, "text.none": false }), size);
      expect(XMLValidator.validate(on), preset.id).toBe(true);
      expect(on, preset.id).not.toMatch(/NaN|undefined|Infinity/);
      expect(on.toLowerCase(), preset.id).toContain("#000000");
    }
  });

  it("keeps the quote readable on black (4.5:1) for every supported preset", () => {
    for (const gen of supported.filter((g) => g.trueBlack?.bg))
      for (const preset of gen.presets) {
        const p = applyTrueBlack(gen.params, gen.trueBlack!.bg!, resolveParams(gen, preset.id));
        expect(contrastOnBlack(String(p["text.color"])), `${gen.id}/${preset.id}`).toBeGreaterThanOrEqual(4.5);
        for (const k of gen.trueBlack!.bg!) expect(p[k]).toBe("#000000");
      }
  });

  it("lifts dark colours but leaves light ones alone", () => {
    expect(liftForBlack("#ffffff", 4.5)).toBe("#ffffff");
    expect(liftForBlack("#2cffb0", 3)).toBe("#2cffb0");
    expect(contrastOnBlack(liftForBlack("#1b263b", 4.5))).toBeGreaterThanOrEqual(4.5);
    expect(contrastOnBlack(liftForBlack("#000000", 3))).toBeGreaterThanOrEqual(3);
  });
});
