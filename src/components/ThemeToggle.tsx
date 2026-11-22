"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Browser-bar colour for each theme (matches --bg). */
const THEME_COLOR: Record<Theme, string> = { dark: "#0a0d1a", light: "#fbf7f1" };

/** Midnight is the default; light only when the visitor picked it. */
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function syncThemeColor(theme: Theme) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const t = currentTheme();
    setTheme(t);
    syncThemeColor(t);
  }, []);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    syncThemeColor(next);
    try {
      localStorage.setItem("ws.theme", next);
    } catch {
      /* storage unavailable; the theme still applies for this visit */
    }
    setTheme(next);
  };

  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggle} aria-label={label} title={label} data-theme-state={theme ?? "dark"}>
      {/* Both glyphs are drawn; CSS shows the one for the current theme and turns it on change. */}
      <svg className="tt-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" fill="currentColor" />
      </svg>
      <svg className="tt-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
