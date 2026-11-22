"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface NavLink {
  href: string;
  label: string;
  /** One line under the link in the phone menu. */
  note: string;
  /** Other paths that count as being "on" this link. */
  match?: (path: string) => boolean;
}

const LINKS: NavLink[] = [
  { href: "/studio", label: "Studio", note: "Make your own wallpaper" },
  { href: "/paint", label: "Paint", note: "Turn a photo into a painting" },
  { href: "/gallery", label: "Gallery", note: "Ready-made downloads" },
  { href: "/today", label: "Today", note: "One seed a day, the same for everyone", match: (p) => p.startsWith("/s/") },
  { href: "/#generators", label: "Generators", note: "Every look, one page each", match: (p) => p.startsWith("/generators/") },
  { href: "/mac", label: "Mac app", note: "A new wallpaper every morning" },
  { href: "/claude", label: "Claude", note: "Backgrounds made from a chat" },
];

const isActive = (l: NavLink, path: string) => path === l.href || (l.match?.(path) ?? false);

export function SiteHeader() {
  const path = usePathname();
  const sentinel = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The header turns solid once the top of the page scrolls away. An observer on a
  // sentinel avoids a scroll listener entirely.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(entry ? !entry.isIntersecting : false));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A client-side navigation keeps the popover in the DOM, so close it on every route change.
  useEffect(() => {
    if (menu.current?.matches(":popover-open")) menu.current.hidePopover();
  }, [path]);

  const closeMenu = () => {
    if (menu.current?.matches(":popover-open")) menu.current.hidePopover();
  };

  return (
    <>
      <span ref={sentinel} className="header-sentinel" aria-hidden="true" />
      <header className="site-header" data-scrolled={scrolled}>
        <div className="container header-row">
          <Link href="/" className="brand" aria-label="Seedwall home">
            <Logo />
          </Link>

          <nav className="nav-wide" aria-label="Main">
            <ul>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={isActive(l, path) ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-tools">
            <ThemeToggle />
            <button
              type="button"
              className="menu-btn"
              popoverTarget="site-menu"
              aria-controls="site-menu"
              data-open={menuOpen}
            >
              <span className="menu-icon" aria-hidden="true">
                <i />
                <i />
              </span>
              <span>Menu</span>
            </button>
          </div>
        </div>

        <div
          id="site-menu"
          ref={menu}
          className="menu-panel"
          popover="auto"
          onToggle={(e) => setMenuOpen((e as unknown as ToggleEvent).newState === "open")}
        >
          <nav aria-label="Main">
            <ul>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={isActive(l, path) ? "page" : undefined} onClick={closeMenu}>
                    <span className="mp-label">{l.label}</span>
                    <span className="mp-note">{l.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="menu-foot">
            <Link className="btn btn-primary btn-block" href="/studio" onClick={closeMenu}>
              Open the studio
            </Link>
            <button type="button" className="btn btn-ghost btn-block" popoverTarget="site-menu" popoverTargetAction="hide">
              Close menu
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
