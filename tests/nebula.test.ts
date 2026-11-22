import { describe, expect, it } from "vitest";
import { getGenerator, renderWallpaper, resolveParams } from "@/generators";

// feTurbulence is by far the slowest part of rendering a nebula (resvg on the server, and
// browsers without GPU raster). These keep it cheap.
describe("nebula render cost", () => {
  const gen = getGenerator("nebula")!;
  const size = { w: 3024, h: 1964 };

  it.each(gen.presets.map((p) => p.id))("%s uses at most two noise sources for the gas, plus a small grain tile", (preset) => {
    const svg = renderWallpaper(gen, resolveParams(gen, preset), size);
    const turbulence = svg.match(/<feTurbulence [^>]*>/g) ?? [];
    expect(turbulence.length).toBeLessThanOrEqual(3);
    for (const t of turbulence) expect(Number(/numOctaves="(\d+)"/.exec(t)?.[1])).toBeLessThanOrEqual(4);
    // Grain is drawn once on a small tile, never as noise over the whole screen.
    expect(svg).not.toMatch(new RegExp(`<rect width="${size.w}" height="${size.h}"[^>]*filter=`));
  });

  it("only runs the gas filter around the cloud, not over the whole screen", () => {
    const svg = renderWallpaper(gen, resolveParams(gen, "violet"), size);
    const m = /<filter id="nb-gas" filterUnits="userSpaceOnUse" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/.exec(svg);
    expect(m).not.toBeNull();
    const [, , , fw, fh] = m!.map(Number);
    expect(fw! * fh!).toBeLessThan(size.w * size.h);
  });
});
