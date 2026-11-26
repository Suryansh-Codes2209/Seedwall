import { AUTHOR, REPO_URL, absoluteUrl } from "@/config/seo";
import { SITE } from "@/config/site";
import { DEVICES } from "@/config/devices";
import { GENERATORS } from "@/generators";
import { THEMES } from "@/generators/shared/themes";
import { GUIDES } from "@/content/guides";

export const dynamic = "force-static";

/** A plain-text map of the site for LLM crawlers (llmstxt.org). */
export function GET(): Response {
  const body = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.tagline} Every wallpaper is an SVG produced by a deterministic TypeScript generator from parameters and a seed. Free, no account.`,
    "",
    `Made by ${AUTHOR.name} (${AUTHOR.url}). Source: ${REPO_URL}`,
    "",
    "## Pages",
    `- [Studio](${absoluteUrl("/studio")}): pick a generator and preset, change colours, apply an editor theme, write a quote or go text-free, download PNG/SVG.`,
    `- [Paint my photo](${absoluteUrl("/paint")}): turn a photo into a palette-knife impasto painting in the browser (nothing is uploaded), download PNG/SVG.`,
    `- [Gallery](${absoluteUrl("/gallery")}): the Cutting Mat pack (desktop + phone, with and without text) and generated samples, all free to download.`,
    `- [All generators](${absoluteUrl("/generators")}): every look on one page, each linking to its own page with presets, samples and a guide.`,
    `- [Today's seed](${absoluteUrl("/today")}): one wallpaper a day, the same for everyone. Every seed from 1 to 999999 has a page at ${SITE.url}/s/{seed}.`,
    `- GitHub wallpapers: ${SITE.url}/u/{username} draws someone's real public contribution graph and commit history.`,
    `- [Daily wallpaper on any device](${absoluteUrl("/daily")}): set today's wallpaper automatically on iPhone and iPad (Shortcuts), Android (Tasker or MacroDroid), Windows (a PowerShell script and a scheduled task) and Linux (cron with GNOME or feh).`,
    `- [Live wallpapers](${absoluteUrl("/live")}): moving 3D scenes rendered with WebGL2 that loop seamlessly; each has presets, colours and a seed at ${SITE.url}/live/{scene}, with still PNG and video loop downloads. The catalogue is JSON at ${absoluteUrl("/api/live")}.`,
    `- [Mac app](${absoluteUrl("/mac")}): a menu-bar app that sets a new wallpaper every day.`,
    `- [Claude connector and plugin](${absoluteUrl("/claude")}): render any generator from claude.ai or Claude Code, for hero backgrounds, OG images and banners.`,
    "",
    `- [About](${absoluteUrl("/about")}): who makes Seedwall and how the generators work.`,
    `- [Contact](${absoluteUrl("/contact")}): email, GitHub issues and socials.`,
    `- [Privacy policy](${absoluteUrl("/privacy")}): what Seedwall collects, Google Analytics and AdSense cookies, and how to opt out.`,
    `- [Terms of use](${absoluteUrl("/terms")}): free downloads, what you can do with the wallpapers you make, the MIT-licensed code, the image API and ads.`,
    "",
    "## Guides",
    `- [All guides](${absoluteUrl("/guides")})`,
    ...GUIDES.map((g) => `- [${g.title}](${absoluteUrl(`/guides/${g.slug}`)}): ${g.description}`),
    "",
    "## Image API",
    `- ${SITE.url}/api/s/{seed}?w=&h= (or ?d={device}): PNG of a seed; &format=svg for SVG, &format=json for what the seed picks.`,
    `- ${absoluteUrl("/api/daily")}?d={device}[&date=YYYY-MM-DD]: today's wallpaper; &format=json for { date, seed, page, image }.`,
    `- ${SITE.url}/api/u/{username}?look=grid|skyline|dots|light|history|history-paper&theme={id}&d={device}: a GitHub wallpaper.`,
    `- ${absoluteUrl("/api/render")}?g={generator}&p={preset}&w=&h=[&x={base64url JSON params}][&t={theme}]: any generator at any size (same query as a /studio link); &format=svg, or &format=json for image and studio URLs.`,
    `- ${absoluteUrl("/api/generators")}: every generator with its params and presets, plus themes and devices, as JSON.`,
    `- MCP server for Claude and other agents: https://github.com/Suryansh-Codes2209/seedwall-mcp`,
    "",
    "## Generators",
    ...GENERATORS.map((g) => `- [${g.name}](${absoluteUrl(`/generators/${g.id}`)}): ${g.description}`),
    "",
    "## Editor themes",
    THEMES.map((t) => t.name).join(", "),
    "",
    "## Sizes",
    DEVICES.map((d) => `${d.label} ${d.w}×${d.h}`).join(", ") + ", or any custom size.",
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
