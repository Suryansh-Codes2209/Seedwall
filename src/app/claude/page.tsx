import type { Metadata } from "next";
import Link from "next/link";
import { LiveThumb } from "@/components/LiveThumb";
import { pageMetadata } from "@/config/seo";
import { getGenerator, resolveParams } from "@/generators";

const MCP_URL = "https://mcp.seedwall.suryansh.work/mcp";
const MCP_REPO = "https://github.com/Suryansh-Codes2209/seedwall-mcp";

/** What the plugin makes by default: a text-free background (LiveThumb wants fully resolved params). */
const heroGen = getGenerator("topographic");
const HERO_PARAMS = heroGen ? resolveParams(heroGen, "survey", { "text.none": true }) : undefined;

export const metadata: Metadata = pageMetadata({
  title: "Seedwall for Claude — generative hero backgrounds, OG images and banners",
  description:
    "Use Seedwall from Claude: a claude.ai connector and a Claude Code plugin that render any generator at any size and wire it into your site as a hero background, section background, OG image or README banner.",
  path: "/claude",
});

export default function ClaudePage() {
  return (
    <div className="container section">
      <section className="gen-hero">
        <div>
          <span className="eyebrow">Seedwall for Claude · connector + plugin</span>
          <h1>Generative art, anywhere on your site.</h1>
          <p>
            Ask Claude for a hero background in your brand colours and it picks a generator, renders it at the right size,
            looks at the preview, and wires it in. It works in claude.ai through a connector, and in your codebase through a
            Claude Code plugin.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#claude-code">Add to Claude Code</a>
            <a className="btn" href="#claude-ai">Add to claude.ai</a>
          </div>
          <p className="preview-dims" style={{ textAlign: "left", marginTop: 12 }}>Free · open source · no account needed</p>
        </div>
        <div className="card-media">
          <LiveThumb gen="topographic" preset="survey" params={HERO_PARAMS} w={2400} h={1500} label="A text-free topographic hero background" />
        </div>
      </section>

      <div className="prose narrow">
        <h2 id="claude-code">Claude Code plugin</h2>
        <p>
          The plugin adds the Seedwall tools and a skill that reads your project&apos;s brand colours, picks a look, downloads
          the art into <code>public/</code>, and writes the CSS: it covers the section at any width, has a dark-mode variant,
          and keeps the headline readable on top.
        </p>
        <pre>{`claude plugin marketplace add Suryansh-Codes2209/seedwall-mcp
claude plugin install seedwall@seedwall`}</pre>
        <p>Then ask something like:</p>
        <ul>
          <li>“Add a topographic hero background in our brand colours.”</li>
          <li>“Give every blog post its own OG image.”</li>
          <li>“Make a README banner with a circuit look.”</li>
        </ul>

        <h2 id="claude-ai">claude.ai connector</h2>
        <p>
          In claude.ai, open <strong>Settings → Connectors → Add custom connector</strong> and paste:
        </p>
        <pre>{MCP_URL}</pre>
        <p>Claude can then render wallpapers, covers and backgrounds in chat and show you a preview of each one.</p>

        <h2>What Claude can do with it</h2>
        <ul>
          <li><strong>list_looks</strong>: every generator and preset, plus the editor themes and device sizes.</li>
          <li><strong>describe_look</strong>: one generator&apos;s colours, shapes and text settings.</li>
          <li><strong>render</strong>: any generator at any size, returned as SVG and PNG links, a preview, and a studio link so you can fine-tune it here.</li>
          <li><strong>seed</strong>: a numbered seed, or <Link href="/today">today&apos;s</Link>.</li>
        </ul>
        <p>
          Every image is deterministic, so the same request always gives the same picture and the links are safe to embed.
          The server stores nothing.
        </p>

        <h2>Other MCP clients</h2>
        <p>Any client that supports remote MCP servers can connect over Streamable HTTP:</p>
        <pre>{`claude mcp add --transport http seedwall ${MCP_URL}`}</pre>
        <p>
          It&apos;s built on the public <code>/api/render</code> and <code>/api/generators</code> endpoints, which you can also
          call yourself:
        </p>
        <pre>{`curl -o hero.svg "https://seedwall.suryansh.work/api/render?g=aurora&w=1920&h=1080&format=svg"
curl "https://seedwall.suryansh.work/api/generators"`}</pre>
        <p>
          Source: <a href={MCP_REPO} target="_blank" rel="noreferrer">github.com/Suryansh-Codes2209/seedwall-mcp ↗</a>
        </p>
      </div>
    </div>
  );
}
