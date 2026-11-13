import { SITE } from "@/config/site";

export const dynamic = "force-static";

/** ads.txt (IAB) authorising Google AdSense to sell ads on this site. 404 until NEXT_PUBLIC_ADSENSE_CLIENT is set. */
export function GET(): Response {
  if (!SITE.adsenseClient) return new Response("Not found", { status: 404 });
  const pub = SITE.adsenseClient.replace(/^ca-/, "");
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
