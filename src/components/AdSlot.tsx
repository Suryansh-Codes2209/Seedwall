"use client";

import { useEffect, useRef } from "react";
import { SITE } from "@/config/site";

/**
 * The site's one ad: a labelled banner at the end of the page, after the content and
 * before the footer. It is kept away from the preview and the download buttons on
 * purpose, so nobody taps an ad while reaching for a wallpaper.
 * Renders nothing until both NEXT_PUBLIC_ADSENSE_CLIENT and NEXT_PUBLIC_ADSENSE_SLOT are set.
 */
export function AdSlot() {
  const pushed = useRef(false);
  const enabled = Boolean(SITE.adsenseClient && SITE.adsenseSlot);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // Ad blocker or the script failed to load: the empty slot hides itself in CSS.
    }
  }, [enabled]);

  if (!enabled) return null;
  return (
    <aside className="container ad-slot" aria-label="Advertisement">
      <span className="label">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={SITE.adsenseClient}
        data-ad-slot={SITE.adsenseSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
    </aside>
  );
}
