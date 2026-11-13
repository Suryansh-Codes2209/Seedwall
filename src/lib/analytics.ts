/**
 * Sends a `wallpaper_download` event to Google Analytics (via the GTM-loaded Google tag).
 * It is registered as a key event in the Seedwall GA4 property. Safe to call on the server
 * or before the tag loads: it just queues onto dataLayer.
 */
export type DownloadSource = "studio" | "seed" | "gallery";

export function trackDownload(params: {
  source: DownloadSource;
  format: "png" | "svg";
  generator?: string;
  width?: number;
  height?: number;
}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  // The Google tag only reads real `arguments` objects, not arrays, so mirror the snippet in layout.tsx.
  const gtag =
    w.gtag ??
    function () {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  gtag("event", "wallpaper_download", {
    download_source: params.source,
    file_format: params.format,
    generator: params.generator,
    size: params.width && params.height ? `${params.width}x${params.height}` : undefined,
  });
}
