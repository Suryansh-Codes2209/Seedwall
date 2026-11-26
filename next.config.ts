import type { NextConfig } from "next";

/** Sent on every response. A Content-Security-Policy is left out until it is tested against GTM and AdSense. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@resvg/resvg-js"],
  // The image API rasterises with the same TTFs as the site; ship them with the functions.
  outputFileTracingIncludes: { "/api/**": ["./public/fonts/**"] },
  // The service worker must always be re-checked, or a stale one could linger.
  // Files in public/ keep their names between deploys (no content hash), so cache for a day, not forever.
  headers: async () => [
    { source: "/(.*)", headers: SECURITY_HEADERS },
    { source: "/:dir(gallery|og|live|icons|fonts)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
  ],
};

export default config;
