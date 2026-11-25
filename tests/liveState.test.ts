import { describe, expect, it } from "vitest";
import { DEFAULT_DEVICE } from "@/config/devices";
import { decodeLiveState, decodePlayOptions, encodeLiveState, liveHref, livePlayHref, type LiveState } from "@/lib/liveState";

const q = (s: string) => new URLSearchParams(s);

describe("decodeLiveState", () => {
  it("round-trips through encodeLiveState", () => {
    const s: LiveState = {
      scene: "glass-orbs",
      preset: "candy",
      overrides: { glass: "#00ff88", count: 6, seed: 1234 },
      device: "iphone",
      w: 1290,
      h: 2796,
    };
    expect(decodeLiveState("glass-orbs", q(encodeLiveState(s)))).toEqual(s);
  });

  it("round-trips a custom size", () => {
    const s: LiveState = { scene: "glass-orbs", preset: "mono", overrides: {}, device: "custom", w: 1000, h: 3000 };
    expect(decodeLiveState("glass-orbs", q(encodeLiveState(s)))).toEqual(s);
  });

  it("puts the seed in its own query key and other overrides in x", () => {
    const enc = q(encodeLiveState({ scene: "glass-orbs", preset: "candy", overrides: { seed: 9, gloss: 0.2 }, device: DEFAULT_DEVICE, w: 3024, h: 1964 }));
    expect(enc.get("p")).toBe("candy");
    expect(enc.get("seed")).toBe("9");
    expect(enc.get("x")).toBeTruthy();
    expect(enc.has("d")).toBe(false);
  });

  it("leaves out overrides that equal the preset", () => {
    const enc = q(encodeLiveState({ scene: "glass-orbs", preset: "candy", overrides: { glass: "#ff4f9a", seed: 27 }, device: DEFAULT_DEVICE, w: 3024, h: 1964 }));
    expect(enc.has("x")).toBe(false);
    expect(enc.has("seed")).toBe(false);
  });

  it("decodes an unknown preset to the first preset", () => {
    const s = decodeLiveState("glass-orbs", q("p=nope"));
    expect(s.preset).toBe("studio");
    expect(s.overrides).toEqual({});
    expect(s.device).toBe(DEFAULT_DEVICE);
  });

  it("decodes garbage x to no overrides", () => {
    expect(decodeLiveState("glass-orbs", q("p=candy&x=%%%")).overrides).toEqual({});
    expect(decodeLiveState("glass-orbs", q("p=candy&x=bm90IGpzb24")).overrides).toEqual({});
  });

  it("drops invalid override values and unknown keys", () => {
    const x = Buffer.from(JSON.stringify({ glass: "red", count: "lots", nope: 1, gloss: 0.3 })).toString("base64url");
    expect(decodeLiveState("glass-orbs", q(`p=candy&x=${x}`)).overrides).toEqual({ gloss: 0.3 });
  });

  it.each([-5, 9e9])("drops an out-of-range seed override %s", (seed) => {
    expect(decodeLiveState("glass-orbs", q(`p=candy&seed=${seed}`)).overrides).toEqual({});
    const x = Buffer.from(JSON.stringify({ seed })).toString("base64url");
    expect(decodeLiveState("glass-orbs", q(`p=candy&x=${x}`)).overrides).toEqual({});
  });

  it("falls back to the first scene for an unknown scene id", () => {
    expect(decodeLiveState("nope", q("")).scene).toBe("glass-orbs");
  });
});

describe("liveHref / livePlayHref", () => {
  const s: LiveState = { scene: "glass-orbs", preset: "candy", overrides: {}, device: DEFAULT_DEVICE, w: 3024, h: 1964 };

  it("points at the scene page", () => {
    expect(liveHref(s)).toBe("/live/glass-orbs?p=candy");
  });

  it("adds fps, scale and mouse to the play URL", () => {
    const href = livePlayHref(s, { fps: 30, scale: 0.66, mouse: true });
    expect(href.startsWith("/live/glass-orbs/play?")).toBe(true);
    expect(href).toContain("fps=30&scale=0.66&mouse=1");
    expect(livePlayHref(s, { mouse: false })).toContain("mouse=0");
    expect(livePlayHref(s, {})).toBe("/live/glass-orbs/play?p=candy");
  });
});

describe("decodePlayOptions", () => {
  const q = (s: string) => decodePlayOptions(new URLSearchParams(s));

  it("defaults to 30 fps, scale 0.66 and the real pointer", () => {
    expect(q("")).toEqual({ fps: 30, scale: 0.66, pointer: true });
  });

  it("reads fps, scale and mouse=0", () => {
    expect(q("fps=60&scale=1&mouse=0")).toEqual({ fps: 60, scale: 1, pointer: false });
    expect(q("mouse=1").pointer).toBe(true);
  });

  it("falls back or clamps on bad values", () => {
    expect(q("fps=24&scale=abc")).toEqual({ fps: 30, scale: 0.66, pointer: true });
    expect(q("scale=0").scale).toBe(0.66);
    expect(q("scale=").scale).toBe(0.66);
    expect(q("scale=9").scale).toBe(2);
    expect(q("scale=0.1").scale).toBe(0.25);
  });

  it("round-trips what livePlayHref writes", () => {
    const s = decodeLiveState("glass-orbs", new URLSearchParams("p=candy"));
    const href = livePlayHref(s, { fps: 60, scale: 0.5, mouse: false });
    expect(q(href.split("?")[1] ?? "")).toEqual({ fps: 60, scale: 0.5, pointer: false });
  });
});
