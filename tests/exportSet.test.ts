import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { SAFE_AREA } from "@/generators/shared/safeArea";
import { initialState } from "@/lib/studioState";
import { seedwallName, setTargets } from "@/lib/exportSet";
import { buildZip } from "@/lib/zip";

describe("matching set", () => {
  it("names files with the look, seed and device", () => {
    expect(seedwallName("aurora", 1234, "iphone", "png")).toBe("seedwall-aurora-1234-iphone.png");
    expect(seedwallName("aurora", 1234, "set", "zip")).toBe("seedwall-aurora-1234-set.zip");
  });

  it("uses MacBook Pro 14 for the desktop when a phone is picked", () => {
    const s = { ...initialState("aurora"), device: "iphone", w: 1290, h: 2796 };
    const t = setTargets(s);
    expect(t.map((x) => [x.id, x.w, x.h])).toEqual([
      ["desktop", 3024, 1964],
      ["iphone", 1290, 2796],
      ["android", 1440, 3120],
      ["ipad", 2048, 2732],
    ]);
    const seed = String(s.params.seed);
    expect(t.map((x) => x.filename)).toEqual(["desktop", "iphone", "android", "ipad"].map((d) => `seedwall-aurora-${seed}-${d}.png`));
  });

  it("keeps the chosen desktop size, preset or custom", () => {
    expect(setTargets({ ...initialState("aurora"), device: "4k", w: 3840, h: 2160 })[0]).toMatchObject({ w: 3840, h: 2160 });
    expect(setTargets({ ...initialState("aurora"), device: "custom", w: 2000, h: 1000 })[0]).toMatchObject({ w: 2000, h: 1000 });
    expect(setTargets({ ...initialState("aurora"), device: "custom", w: 1000, h: 2000 })[0]).toMatchObject({ w: 3024, h: 1964 });
  });

  it("shares the look, params and seed, and keeps the safe area off the desktop", () => {
    const s = initialState("aurora");
    s.params = { ...s.params, seed: 77, [SAFE_AREA]: "clock" };
    const t = setTargets(s);
    for (const x of t) expect(x.params.seed).toBe(77);
    expect(t[0]!.params[SAFE_AREA]).toBe("off");
    expect(t.slice(1).map((x) => x.params[SAFE_AREA])).toEqual(["clock", "clock", "clock"]);
  });
});

describe("zip", () => {
  it("round-trips the files", () => {
    const zip = buildZip([
      { name: "a.png", data: new Uint8Array([1, 2, 3]) },
      { name: "b.txt", data: new TextEncoder().encode("hello") },
    ]);
    const back = unzipSync(zip);
    expect(Object.keys(back)).toEqual(["a.png", "b.txt"]);
    expect([...back["a.png"]!]).toEqual([1, 2, 3]);
    expect(strFromU8(back["b.txt"]!)).toBe("hello");
  });
});
