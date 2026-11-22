import { describe, expect, it } from "vitest";
import { XMLValidator } from "fast-xml-parser";
import { getDevice } from "@/config/devices";
import { GENERATORS, getGenerator, renderWallpaper, resolveParams } from "@/generators";
import { SAFE_AREA, lockScreenZones, safeAreaApplies } from "@/generators/shared/safeArea";
import { layoutText } from "@/generators/shared/text";
import { decodeState, encodeState, initialState } from "@/lib/studioState";

const iphone = { w: 1290, h: 2796 };
const ipad = { w: 2048, h: 2732 };

describe("lock-screen safe zones", () => {
  it("is empty when off or unknown", () => {
    expect(lockScreenZones(iphone, "off")).toEqual([]);
    expect(lockScreenZones(iphone, "nonsense")).toEqual([]);
    expect(lockScreenZones(iphone, undefined)).toEqual([]);
  });

  it("covers the top 30% of a phone, full width", () => {
    expect(lockScreenZones(iphone, "clock")).toEqual([{ x: 0, y: 0, w: 1290, h: 839 }]);
    const android = getDevice("android")!;
    expect(lockScreenZones(android, "clock")).toEqual([{ x: 0, y: 0, w: 1440, h: 936 }]);
  });

  it("adds the bottom button strip when asked", () => {
    const [top, bottom] = lockScreenZones(iphone, "clock-bottom");
    expect(top).toEqual({ x: 0, y: 0, w: 1290, h: 839 });
    expect(bottom).toEqual({ x: 0, y: 2796 - 336, w: 1290, h: 336 });
  });

  it("uses a shorter clock band on a tablet", () => {
    const [top, bottom] = lockScreenZones(ipad, "clock-bottom");
    expect(top!.h).toBe(Math.round(2732 * 0.24));
    expect(bottom!.h).toBe(Math.round(2732 * 0.08));
    expect(bottom!.y + bottom!.h).toBe(2732);
  });

  it("only applies to phones and tablets", () => {
    expect(safeAreaApplies("iphone", 1290, 2796)).toBe(true);
    expect(safeAreaApplies("ipad", 2048, 2732)).toBe(true);
    expect(safeAreaApplies("macbook14", 3024, 1964)).toBe(false);
    expect(safeAreaApplies("custom", 1080, 2400)).toBe(true);
    expect(safeAreaApplies("custom", 1920, 1080)).toBe(false);
  });
});

describe("safe area in the text layer", () => {
  const gen = getGenerator("cutting-mat")!;

  it("is a hidden param on every look, off by default", () => {
    for (const g of GENERATORS) {
      const def = g.params[SAFE_AREA];
      expect(def?.kind, g.id).toBe("select");
      expect(def?.default, g.id).toBe("off");
      expect(def?.hidden, g.id).toBe(true);
    }
  });

  it("adds the zones to the text clear zones, with or without text", () => {
    const p = resolveParams(gen, gen.presets[0]?.id, { [SAFE_AREA]: "clock" }) as never;
    const t = layoutText(p, iphone);
    expect(t.zones).toContainEqual({ x: 0, y: 0, w: 1290, h: 839 });
    const none = layoutText({ ...(p as object), "text.none": true } as never, iphone);
    expect(none.svg).toBe("");
    expect(none.zones).toEqual([{ x: 0, y: 0, w: 1290, h: 839 }]);
  });

  it("changes masking looks when on, and renders valid SVG everywhere", () => {
    for (const g of GENERATORS) {
      const on = renderWallpaper(g, resolveParams(g, g.presets[0]?.id, { [SAFE_AREA]: "clock-bottom" }), { w: 390, h: 844 });
      expect(XMLValidator.validate(on), g.id).toBe(true);
      expect(on, g.id).not.toMatch(/NaN|undefined|Infinity/);
    }
    const off = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id), iphone);
    const on = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id, { [SAFE_AREA]: "clock" }), iphone);
    expect(on).not.toBe(off);
  });

  it("renders exactly as before when off", () => {
    for (const g of GENERATORS) {
      const base = resolveParams(g, g.presets[0]?.id);
      const { [SAFE_AREA]: _omit, ...without } = base;
      expect(renderWallpaper(g, base, iphone), g.id).toBe(renderWallpaper(g, without, iphone));
    }
  });

  it("round-trips through the URL and stays out of links when off", () => {
    const s = { ...initialState("aurora"), device: "iphone", w: 1290, h: 2796 };
    expect(encodeState(s)).not.toContain("x=");
    s.params = { ...s.params, [SAFE_AREA]: "clock-bottom" };
    expect(decodeState(new URLSearchParams(encodeState(s))).params[SAFE_AREA]).toBe("clock-bottom");
  });
});
