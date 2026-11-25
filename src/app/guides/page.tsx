import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/config/seo";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = pageMetadata({
  title: "Wallpaper guides",
  description:
    "Plain-English guides to generative wallpapers: how seeds and noise make a picture, choosing a wallpaper for OLED and dark mode, and getting the right size for any screen.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <div className="container section">
      <header className="longform">
        <span className="eyebrow">Guides</span>
        <h1 className="page-h1">Notes on making a good <em>wallpaper</em>.</h1>
        <p className="lead">
          Longer write-ups on how Seedwall works and how to get a wallpaper that looks right on your screen. Each one is based
          on the real code behind the site, and links to the looks it mentions so you can try them.
        </p>
      </header>
      <div className="prose longform">
        <ul className="guide-list">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`}>
                <strong>{g.title}</strong>
                <span>{g.description}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>
          Every generator also has its own page with its presets and settings: start from the{" "}
          <Link href="/#generators">list of generators</Link>, or open the <Link href="/studio">studio</Link> and try one.
        </p>
      </div>
    </div>
  );
}
