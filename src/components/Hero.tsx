import Link from "next/link";
import { NEW_GENERATORS } from "@/config/site";
import { GENERATORS, getGenerator } from "@/generators";
import { THEMES } from "@/generators/shared/themes";
import { HERO_DESK, HERO_LOOKS, HERO_PHONE, renderHeroLook } from "@/lib/heroLooks";
import { HeroShowcase } from "./HeroShowcase";

export function Hero() {
  // The badge names the two newest looks, so it always agrees with the "New looks" section.
  const newest = NEW_GENERATORS.slice(0, 2).flatMap((id) => getGenerator(id) ?? []);
  // The first look is drawn here on the server, so the devices are never empty on load.
  const first = { desk: renderHeroLook(HERO_LOOKS[0]!, HERO_DESK, "hd0"), phone: renderHeroLook(HERO_LOOKS[0]!, HERO_PHONE, "hp0") };
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          {newest[0] && (
            <Link className="hero-badge" href={`/studio?g=${newest[0].id}`}>
              <span className="hb-dot" aria-hidden="true" />
              New: {newest.map((g) => g.name).join(" and ")}
            </Link>
          )}
          <h1 id="hero-h">
            Wallpapers grown from a <em>seed</em>.
          </h1>
          <p className="lead">
            Seedwall is a free, open-source wallpaper generator: {GENERATORS.length} generative looks drawn by code from a seed,
            not by AI. They range from drafting-table cutting mats and flow fields to black holes and the shapes sound makes in sand. Pick your colours or one of {THEMES.length} editor themes,
            add a quote or leave it out, and download a PNG at your screen&apos;s exact size.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" href="/studio">Open the studio</Link>
            <Link className="btn btn-lg" href="/gallery">Browse the gallery</Link>
          </div>
          <p className="hero-note">Free, no account needed. The studio draws everything right in your browser.</p>
        </div>
        <HeroShowcase looks={HERO_LOOKS} first={first} />
      </div>
    </section>
  );
}
