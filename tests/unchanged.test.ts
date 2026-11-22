import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GENERATORS, renderWallpaper, resolveParams } from "@/generators";

/**
 * Golden hashes of every preset of every look, at a landscape and a portrait size, with text on
 * and off. They were recorded before the studio features (matching sets, lock-screen safe area,
 * monitor spans, photo colours) were added, so this proves those features change nothing while
 * their options are off. Nebula is left out because it is being reworked separately.
 *
 * Only regenerate on purpose, after an intended change to a look:
 *   UPDATE_GOLDEN=1 npx vitest run tests/unchanged.test.ts
 */
const FIXTURE = new URL("./fixtures/render-hashes.json", import.meta.url);
const SKIP = new Set(["nebula"]);
const SIZES = [{ w: 1200, h: 800 }, { w: 390, h: 844 }];

function hashLook(id: string): string {
  const gen = GENERATORS.find((g) => g.id === id)!;
  const h = createHash("sha256");
  for (const preset of gen.presets)
    for (const none of [false, true])
      for (const size of SIZES) h.update(renderWallpaper(gen, resolveParams(gen, preset.id, { "text.none": none }), size)).update("\n");
  return h.digest("hex");
}

if (process.env.UPDATE_GOLDEN === "1") {
  const ids = GENERATORS.map((g) => g.id).filter((id) => !SKIP.has(id));
  mkdirSync(new URL("./fixtures/", import.meta.url), { recursive: true });
  writeFileSync(FIXTURE, JSON.stringify(Object.fromEntries(ids.map((id) => [id, hashLook(id)])), null, 2) + "\n");
}

describe("existing renders are byte-identical", () => {
  const golden: Record<string, string> = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, "utf8")) : {};

  it("has a golden hash for every look but the skipped ones", () => {
    expect(Object.keys(golden).length).toBeGreaterThanOrEqual(30);
  });

  it.each(Object.keys(golden))("%s", (id) => {
    expect(hashLook(id)).toBe(golden[id]);
  });
});
