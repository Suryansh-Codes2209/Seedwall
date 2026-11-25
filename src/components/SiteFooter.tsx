import Link from "next/link";
import { SITE } from "@/config/site";
import { AUTHOR, REPO_URL } from "@/config/seo";
import { GENERATORS } from "@/generators";
import { Logo } from "./Logo";
import { ReportLink } from "./ReportLink";

const GITHUB_ICON = "M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57v-2.1c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z";

/** Same profiles as suryansh.work. Paths are the brands' own simple glyphs (24×24). */
const SOCIALS = [
  {
    label: "X (Twitter)",
    handle: "@suryanshbuilds",
    href: "https://x.com/suryanshbuilds",
    d: "M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.8 2h6.4l4.4 5.9L18.9 2Zm-1.1 18.1h1.7L8.3 3.8H6.5l11.3 16.3Z",
  },
  {
    label: "LinkedIn",
    handle: "suryansh-chaudhary-2209",
    href: "https://www.linkedin.com/in/suryansh-chaudhary-2209/",
    d: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  },
  {
    label: "GitHub",
    handle: "Suryansh-Codes2209",
    href: "https://github.com/Suryansh-Codes2209",
    d: GITHUB_ICON,
  },
] as const;

/**
 * Where "a wallpaper a day" lives. /today redirects to today's seed; point this at the
 * daily page once it exists.
 */
const DAILY_HREF = "/today";

function Socials() {
  return (
    <ul className="socials" aria-label="Suryansh on social media">
      {SOCIALS.map((s) => (
        <li key={s.label}>
          <a href={s.href} target="_blank" rel="noreferrer me" aria-label={`${s.label}: ${s.handle}`} title={`${s.label}: ${s.handle}`}>
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
              <path d={s.d} fill="currentColor" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Opens in a new tab: an arrow after the text says so, and is hidden from screen readers. */
function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="ext" aria-hidden="true">↗</span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-lockup">
        <p className="footer-big">
          Every number from 1 to 999,999 is a <em>wallpaper</em>.
        </p>
        <div className="footer-cta">
          <Link className="btn btn-primary btn-lg" href="/studio">Open the studio</Link>
          <Link className="btn btn-lg" href={DAILY_HREF}>See today&apos;s seed</Link>
        </div>
      </div>

      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Seedwall home" className="footer-logo">
            <Logo size={32} />
          </Link>
          <p>
            {GENERATORS.length} generators, each a few hundred lines of TypeScript that turn colours, words and one number into an
            SVG. The same seed always grows the same wallpaper.
          </p>
          <Socials />
        </div>

        <nav className="footer-col" aria-labelledby="fc-make">
          <h2 id="fc-make" className="footer-h">Make</h2>
          <ul>
            <li><Link href="/studio">Studio</Link></li>
            <li><Link href="/paint">Paint my photo</Link></li>
            <li><Link href={DAILY_HREF}>Today&apos;s seed</Link></li>
            <li><Link href="/daily">Daily on any device<span className="new-tag">New</span></Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/#personal-h">Your GitHub wallpaper</Link></li>
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="fc-tools">
          <h2 id="fc-tools" className="footer-h">Tools</h2>
          <ul>
            <li><Link href="/mac">Mac app</Link></li>
            <li><Link href="/claude">Claude connector</Link></li>
            <li><Ext href={`${REPO_URL}#seeds-github-wallpapers-and-the-image-api`}>Image API</Ext></li>
            {SITE.driveUrl && <li><Ext href={SITE.driveUrl}>Full pack on Drive</Ext></li>}
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="fc-about">
          <h2 id="fc-about" className="footer-h">About</h2>
          <ul>
            <li><Link href="/about">About Seedwall</Link></li>
            <li><Link href="/guides">Guides</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Ext href={REPO_URL}>Source on GitHub</Ext></li>
            <li><Ext href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>Add a generator</Ext></li>
            <li><ReportLink>Report a bug</ReportLink></li>
            <li><Ext href={AUTHOR.url}>Who made this</Ext></li>
          </ul>
        </nav>
      </div>

      <div className="container footer-bottom">
        <p>
          © {year} Seedwall. Designed and built by{" "}
          <a href={AUTHOR.url} target="_blank" rel="noreferrer" className="credit-link">{AUTHOR.name}</a>.
        </p>
        <nav aria-label="Legal">
          <ul className="footer-legal">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </nav>
        <p className="footer-quip">Made by one person who changes wallpapers far too often.</p>
      </div>
    </footer>
  );
}
