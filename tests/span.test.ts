import { describe, expect, it } from "vitest";
import { XMLValidator } from "fast-xml-parser";
import { getGenerator, renderWallpaper, resolveParams } from "@/generators";
import { SPAN_LIMITS, combinedFits, cropSvg, quoteNearGap, spanFilename, spanLayout } from "@/lib/span";

const m = (w: number, h: number) => ({ device: "custom", w, h });

describe("span layout", () => {
  it("lays equal monitors side by side with the gap between them", () => {
    const l = spanLayout([m(1920, 1080), m(1920, 1080)], 100, "center");
    expect(l.canvas).toEqual({ w: 3940, h: 1080 });
    expect(l.slices).toEqual([
      { x: 0, y: 0, w: 1920, h: 1080 },
      { x: 2020, y: 0, w: 1920, h: 1080 },
    ]);
    expect(l.combined).toEqual({ w: 3840, h: 1080 });
    expect(l.placements).toEqual([{ x: 0, y: 0 }, { x: 1920, y: 0 }]);
  });

  it("aligns monitors of different heights to the top, centre or bottom", () => {
    const mons = [m(2560, 1440), m(1920, 1080), m(2560, 1440)];
    const ys = (a: "top" | "center" | "bottom") => spanLayout(mons, 50, a).slices.map((s) => s.y);
    expect(ys("top")).toEqual([0, 0, 0]);
    expect(ys("center")).toEqual([0, 180, 0]);
    expect(ys("bottom")).toEqual([0, 360, 0]);
    const l = spanLayout(mons, 50, "bottom");
    expect(l.canvas).toEqual({ w: 2560 + 50 + 1920 + 50 + 2560, h: 1440 });
    expect(l.slices.map((s) => s.x)).toEqual([0, 2610, 4580]);
    expect(l.placements).toEqual([{ x: 0, y: 0 }, { x: 2560, y: 360 }, { x: 4480, y: 0 }]);
  });

  it("drops gap pixels: slices plus gaps cover the canvas width exactly", () => {
    const l = spanLayout([m(3024, 1964), m(3840, 2160), m(1920, 1080)], 37, "center");
    const last = l.slices[l.slices.length - 1]!;
    expect(last.x + last.w).toBe(l.canvas.w);
    expect(l.slices.reduce((a, s) => a + s.w, 0) + 37 * 2).toBe(l.canvas.w);
    for (const s of l.slices) expect(s.y + s.h).toBeLessThanOrEqual(l.canvas.h);
  });

  it("clamps the gap and the monitor sizes", () => {
    const l = spanLayout([m(50, 50), m(99999, 1080)], -20, "top");
    expect(l.slices[0]).toMatchObject({ w: 200, h: 200 });
    expect(l.slices[1]!.w).toBe(8192);
    expect(l.slices[1]!.x).toBe(200);
    expect(spanLayout([m(1920, 1080), m(1920, 1080)], 1e9, "top").slices[1]!.x).toBe(1920 + SPAN_LIMITS.maxGap);
  });

  it("says when the one wide image is too big for a browser canvas", () => {
    expect(combinedFits(spanLayout([m(3840, 2160), m(3840, 2160)], 0, "top"))).toBe(true);
    expect(combinedFits(spanLayout([m(8192, 4000), m(8192, 4000), m(8192, 4000)], 0, "top"))).toBe(false);
  });

  it("names the files left to right", () => {
    expect(spanFilename("aurora", 9, 0, 3, "png")).toBe("seedwall-aurora-9-monitor-1-left.png");
    expect(spanFilename("aurora", 9, 1, 3, "png")).toBe("seedwall-aurora-9-monitor-2-middle.png");
    expect(spanFilename("aurora", 9, 1, 2, "png")).toBe("seedwall-aurora-9-monitor-2-right.png");
  });

  it("warns when a centred quote would fall in the middle of two monitors", () => {
    const two = spanLayout([m(1920, 1080), m(1920, 1080)], 80, "top");
    const three = spanLayout([m(1920, 1080), m(1920, 1080), m(1920, 1080)], 80, "top");
    expect(quoteNearGap(two, "center")).toBe(true);
    expect(quoteNearGap(three, "center")).toBe(false);
    expect(quoteNearGap(two, "top-left")).toBe(false);
  });
});

describe("cropping the canvas", () => {
  const gen = getGenerator("aurora")!;
  const layout = spanLayout([m(800, 450), m(800, 450)], 60, "top");
  const full = renderWallpaper(gen, resolveParams(gen, gen.presets[0]?.id), layout.canvas);

  it("gives a valid SVG the size of the monitor, shifted to its slice", () => {
    const slice = layout.slices[1]!;
    const out = cropSvg(full, slice);
    expect(XMLValidator.validate(out)).toBe(true);
    expect(out.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">`)).toBe(true);
    expect(out).toContain(`x="-860" y="0" width="${layout.canvas.w}" height="${layout.canvas.h}"`);
    expect(out.endsWith("</svg></svg>")).toBe(true);
  });

  it("keeps the picture: the inner document is the full render", () => {
    const out = cropSvg(full, layout.slices[0]!);
    const inner = full.slice(full.indexOf(">") + 1);
    expect(out).toContain(inner);
  });
});
