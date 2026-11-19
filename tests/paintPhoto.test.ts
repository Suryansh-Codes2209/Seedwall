import { describe, expect, it } from "vitest";
import { XMLValidator } from "fast-xml-parser";
import { analysePhoto, paintPhoto, type PhotoPixels } from "@/lib/paintPhoto";

/** A synthetic "photo": warm left half, cool right half, a bright disc and a diagonal edge. */
function fakePhoto(w: number, h: number, alpha = 255): PhotoPixels {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const disc = Math.hypot(x - w * 0.6, y - h * 0.4) < Math.min(w, h) * 0.18;
      const warm = x < w / 2;
      data[i] = disc ? 250 : warm ? 190 : 40;
      data[i + 1] = disc ? 235 : warm ? 90 : 70;
      data[i + 2] = disc ? 200 : warm ? 30 : 150 + (x + y > w ? 60 : 0);
      data[i + 3] = alpha;
    }
  return { width: w, height: h, data };
}

describe("paintPhoto", () => {
  const photo = fakePhoto(320, 200);

  it.each([
    ["landscape", { w: 1920, h: 1080 }],
    ["phone", { w: 1179, h: 2556 }],
    ["tiny", { w: 320, h: 240 }],
  ])("renders valid SVG at %s", (_n, size) => {
    const svg = paintPhoto(photo, size, { seed: 3 });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${size.w} ${size.h}"`);
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    expect(XMLValidator.validate(svg)).toBe(true);
  });

  it("is deterministic and seed-sensitive", () => {
    const size = { w: 1600, h: 1000 };
    expect(paintPhoto(photo, size, { seed: 9 })).toBe(paintPhoto(photo, size, { seed: 9 }));
    expect(paintPhoto(photo, size, { seed: 9 })).not.toBe(paintPhoto(photo, size, { seed: 10 }));
  });

  it("keeps the photo's colours", () => {
    const svg = paintPhoto(photo, { w: 1600, h: 1000 }, { boost: 0, relief: 0 });
    const fills = [...svg.matchAll(/fill="#([0-9a-f]{6})"/g)].map((m) => m[1]!);
    const warm = fills.filter((h) => parseInt(h.slice(0, 2), 16) > parseInt(h.slice(4, 6), 16) + 60).length;
    const cool = fills.filter((h) => parseInt(h.slice(4, 6), 16) > parseInt(h.slice(0, 2), 16) + 60).length;
    expect(warm).toBeGreaterThan(fills.length * 0.2);
    expect(cool).toBeGreaterThan(fills.length * 0.2);
  });

  it("finds edges where the photo has them", () => {
    const size = { w: 1600, h: 1000 };
    const f = analysePhoto(photo, size, 0);
    const at = (fx: number, fy: number) => f.edge[Math.floor(fy * f.gh) * f.gw + Math.floor(fx * f.gw)]!;
    expect(at(0.5, 0.9)).toBeGreaterThan(at(0.2, 0.8) * 3); // the warm/cool boundary vs a flat area
  });

  it("copes with tiny, huge-aspect and transparent photos", () => {
    for (const p of [fakePhoto(3, 2), fakePhoto(800, 10), fakePhoto(50, 50, 0)]) {
      const svg = paintPhoto(p, { w: 1200, h: 800 }, {});
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
      expect(XMLValidator.validate(svg)).toBe(true);
    }
  });
});
