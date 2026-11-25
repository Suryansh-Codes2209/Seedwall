import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/live/route";
import { LIVE_SCENES } from "@/live";

interface Catalogue {
  scenes: {
    id: string;
    name: string;
    description: string;
    loopSeconds: number;
    mouse: boolean;
    params: Record<string, unknown>;
    presets: { id: string; title: string; poster: string; posterPhone: string }[];
    page: string;
    play: string;
  }[];
}

describe("GET /api/live", () => {
  it("lists every scene with pages, play URLs and posters on disk", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("public, max-age=3600");
    const body = (await res.json()) as Catalogue;
    expect(body.scenes.map((s) => s.id)).toEqual(LIVE_SCENES.map((s) => s.id));
    for (const s of body.scenes) {
      const scene = LIVE_SCENES.find((x) => x.id === s.id)!;
      expect(s.name).toBe(scene.name);
      expect(s.loopSeconds).toBe(scene.loopSeconds);
      expect(s.mouse).toBe(scene.mouse);
      expect(Object.keys(s.params)).toEqual(Object.keys(scene.params));
      expect(s.page).toBe(`/live/${s.id}`);
      expect(s.play.startsWith(`/live/${s.id}/play`)).toBe(true);
      expect(s.presets.map((p) => p.id)).toEqual(scene.presets.map((p) => p.id));
      for (const p of s.presets) {
        expect(p.title).toBeTruthy();
        for (const poster of [p.poster, p.posterPhone]) {
          expect(poster.startsWith(`/live/${s.id}/`)).toBe(true);
          expect(existsSync(join(process.cwd(), "public", poster)), poster).toBe(true);
        }
      }
    }
  });
});
