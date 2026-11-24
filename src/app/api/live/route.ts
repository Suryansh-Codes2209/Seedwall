import { LIVE_SCENES } from "@/live";

export const dynamic = "force-static";

/**
 * The live wallpaper catalogue, for the Mac app and other tools.
 *   GET /api/live → { scenes: [{ id, name, description, loopSeconds, mouse, params, presets, page, play }] }
 * Paths are site-relative. `play` is the chromeless player; add the scene page's query plus fps, scale and mouse.
 */
export function GET() {
  const scenes = LIVE_SCENES.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    loopSeconds: s.loopSeconds,
    mouse: s.mouse,
    params: Object.fromEntries(Object.entries(s.params).filter(([, d]) => !d.hidden)),
    presets: s.presets.map((p) => ({
      id: p.id,
      title: p.title,
      poster: `/live/${s.id}/${p.id}.jpg`,
      posterPhone: `/live/${s.id}/${p.id}-phone.jpg`,
    })),
    page: `/live/${s.id}`,
    play: `/live/${s.id}/play`,
  }));
  return Response.json(
    { scenes },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400", "Access-Control-Allow-Origin": "*" } },
  );
}
