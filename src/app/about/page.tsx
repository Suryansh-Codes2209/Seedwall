import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, REPO_URL, pageMetadata } from "@/config/seo";
import { DEVICES } from "@/config/devices";
import { GENERATORS } from "@/generators";
import { THEMES } from "@/generators/shared/themes";

export const metadata: Metadata = pageMetadata({
  title: "About Seedwall",
  description: `Who makes Seedwall and how it works: ${GENERATORS.length} open-source wallpaper generators, each a TypeScript function that turns colours, words and one number into an SVG. Free, no account.`,
  path: "/about",
});

const MCP_REPO = "https://github.com/Suryansh-Codes2209/seedwall-mcp";

export default function AboutPage() {
  const presets = GENERATORS.reduce((n, g) => n + g.presets.length, 0);
  return (
    <div className="container section">
      <header className="longform">
        <span className="eyebrow">About</span>
        <h1 className="page-h1">One person, one number, a lot of <em>wallpapers</em>.</h1>
        <p className="lead">
          I&apos;m {AUTHOR.name}, and I make Seedwall on my own. It&apos;s a free wallpaper generator where every picture is
          drawn by code from a handful of settings and a seed.
        </p>
      </header>

      <div className="prose longform">
        <h2>Why it exists</h2>
        <p>
          I change my wallpaper far too often, and I wanted one that was actually mine: in my colours, at my screen&apos;s exact
          size, with my own line of text or none. Seedwall started as a single generator, a drafting cutting mat with a grid,
          angled guides and a quote kept clear of the lines. It is still the look behind the Cutting Mat pack in
          the <Link href="/gallery">gallery</Link>. Once the first look worked, I kept adding more.
        </p>

        <h2>How the generators work</h2>
        <p>
          There are now {GENERATORS.length} generators with {presets} presets between them. Each one is a single TypeScript
          file, a pure function that takes its parameters, a screen size and a seeded random number generator, and returns an
          SVG. Nothing is drawn by hand and there are no stored pictures behind the generator pages: the{" "}
          <Link href="/studio">studio</Link> runs the same code in your browser that the server runs for the image API.
        </p>
        <p>
          That makes every wallpaper deterministic. The same generator, settings, size and seed always give the same file, on
          any device. It is also why seeds can be shared: every number from 1 to 999,999 has its own page at{" "}
          <code>/s/&lt;number&gt;</code>, and <Link href="/today">today&apos;s seed</Link> is the same for everyone. Layouts are
          measured in fractions of the screen rather than pixels, so one look works from a phone to an ultrawide monitor. A
          shared text layer measures your words with the real font files and keeps shapes out of the way so nothing runs
          through your quote.
        </p>
        <p>
          If you want the details, I wrote a guide on{" "}
          <Link href="/guides/how-generative-wallpapers-work">how seeds, noise and determinism work</Link> in this codebase.
        </p>

        <h2>Open source</h2>
        <p>
          All of Seedwall is open source under the MIT License at <a href={REPO_URL}>{REPO_URL.replace("https://", "")}</a>:
          the site, the generators, the image API, the command-line renderer and the Mac app. New looks are welcome. Each one is
          a single file, and the <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>contributing guide</a> walks through adding
          one.
        </p>

        <h2>What&apos;s free</h2>
        <p>Everything. There is no account, no paid tier and no watermark. You can:</p>
        <ul>
          <li>Pick a look in the <Link href="/studio">studio</Link>, change its colours, text, seed and size, and download a full-size PNG or SVG.</li>
          <li>Recolour any look with one of {THEMES.length} editor themes, such as Dracula, Nord and Tokyo Night.</li>
          <li>Export a matching set for desktop, iPhone, Android and iPad, or one picture spanned across two or three monitors.</li>
          <li>Turn a photo into a palette-knife painting on <Link href="/paint">/paint</Link>, in your browser, without uploading it.</li>
          <li>Type a GitHub username to draw that account&apos;s real contribution graph or commit history.</li>
          <li>Download ready-made wallpapers from the <Link href="/gallery">gallery</Link>.</li>
          <li>Use the public image API from your own scripts, at {DEVICES.length} preset sizes or any custom size.</li>
        </ul>
        <p>
          The site may show one ad, labelled, at the bottom of the page. I keep it away from the preview and the download
          buttons on purpose. The <Link href="/privacy">privacy policy</Link> explains what it and the analytics collect.
        </p>

        <h2>The Mac app</h2>
        <p>
          <Link href="/mac">Seedwall for Mac</Link> is a small menu-bar app for macOS 13 or later. Once a day it sets a new
          wallpaper on every display, at that display&apos;s native resolution: today&apos;s seed, a random one, a seed you pin,
          or your own GitHub graph in an editor theme. On iPhone, iPad, Android, Windows and Linux, the{" "}
          <Link href="/daily">daily setup guide</Link> does the same job with Shortcuts, Tasker, a PowerShell script or cron.
        </p>

        <h2>Seedwall in Claude</h2>
        <p>
          Seedwall also works from Claude. A <Link href="/claude">claude.ai connector and a Claude Code plugin</Link>, built on
          the open-source <a href={MCP_REPO}>seedwall-mcp</a> server, let Claude list the looks, render any of them at any size
          and use the result as a hero background, an Open Graph image or a README banner. It uses the same public API as
          everything else here.
        </p>

        <h2>Get in touch</h2>
        <p>
          Bug reports, ideas for new looks and questions are all welcome. Email me at{" "}
          <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>, open an issue on <a href={`${REPO_URL}/issues`}>GitHub</a>, or
          find me on <a href={AUTHOR.x}>X</a> and <a href={AUTHOR.linkedin}>LinkedIn</a>. The{" "}
          <Link href="/contact">contact page</Link> has more on what to include. My other work is at{" "}
          <a href={AUTHOR.url}>suryansh.work</a>.
        </p>
      </div>
    </div>
  );
}
