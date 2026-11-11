import { DEVICES } from "@/config/devices";
import { GENERATORS } from "@/generators";
import { THEMES } from "@/generators/shared/themes";

export const runtime = "nodejs";

/**
 * The catalogue, for the MCP server and other tools.
 *   GET /api/generators → { generators: [{ id, name, description, presets, params }], themes, devices }
 * Hidden params (data fed in by code, like GitHub history) are left out.
 */
export function GET() {
  const generators = GENERATORS.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    presets: g.presets.map((p) => ({ id: p.id, title: p.title, params: p.params })),
    params: Object.fromEntries(Object.entries(g.params).filter(([, d]) => !d.hidden)),
  }));
  return Response.json(
    {
      generators,
      themes: THEMES.map((t) => ({ id: t.id, name: t.name, bg: t.bg, fg: t.fg })),
      devices: DEVICES,
    },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400", "Access-Control-Allow-Origin": "*" } },
  );
}
