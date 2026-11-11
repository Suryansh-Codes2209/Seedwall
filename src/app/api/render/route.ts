import { absoluteUrl } from "@/config/seo";
import { applyTheme, getGenerator, resolveParams } from "@/generators";
import { getTheme } from "@/generators/shared/themes";
import { formatFromQuery, sizeFromQuery, wallpaperResponse } from "@/lib/server/imageResponse";
import { decodeState, encodeState } from "@/lib/studioState";

export const runtime = "nodejs";

/** Output is deterministic, but generator code can change between releases, so don't cache forever. */
const CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

/**
 * Any wallpaper, from the same query the studio uses.
 *   GET /api/render?g=<generator>&p=<preset>&d=<device>|w=&h=[&x=<base64url JSON params>][&t=<theme>][&format=png|svg|json]
 * `t` recolours with a syntax theme. `format=json` returns canonical image and studio URLs
 * (theme baked into the params), which is what the MCP server hands back to Claude.
 */
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const genId = q.get("g");
  const gen = genId ? getGenerator(genId) : undefined;
  if (!gen) return new Response("Unknown or missing generator (?g=). See /api/generators", { status: 404 });
  const presetId = q.get("p");
  if (presetId && !gen.presets.some((p) => p.id === presetId)) return new Response(`Unknown preset "${presetId}" for ${gen.id}`, { status: 404 });
  const themeId = q.get("t");
  if (themeId && !getTheme(themeId)) return new Response(`Unknown theme "${themeId}". See /api/generators`, { status: 404 });

  const state = decodeState(q);
  const params = themeId ? resolveParams(gen, state.preset, applyTheme(gen, state.params, themeId)) : state.params;
  const size = sizeFromQuery(q, { w: state.w, h: state.h });

  if (q.get("format") === "json") {
    const canonical = encodeState({ ...state, device: "custom", w: size.w, h: size.h, params });
    return Response.json(
      {
        gen: gen.id,
        preset: state.preset,
        size,
        params,
        svg: absoluteUrl(`/api/render?${canonical}&format=svg`),
        png: absoluteUrl(`/api/render?${canonical}`),
        studio: absoluteUrl(`/studio?${canonical}`),
      },
      { headers: { "Cache-Control": CACHE, "Access-Control-Allow-Origin": "*" } },
    );
  }
  return wallpaperResponse(gen.id, params, size, formatFromQuery(q), CACHE, `seedwall-${gen.id}`);
}
