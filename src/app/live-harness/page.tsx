import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveHarness } from "./LiveHarness";

/**
 * Dev-only: renders one frame of a live scene for `npm run live:posters`.
 *   /live-harness?scene=<id>&preset=<id>&w=<px>&h=<px>&phase=<0..1>
 * Sets `window.__liveReady` to `true` or `"error:<log>"`. Not served in production.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Query = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

function int(v: string | undefined, fallback: number): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 8192) : fallback;
}

export default async function LiveHarnessPage({ searchParams }: { searchParams: Promise<Query> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;
  const phase = Number(first(q.phase) ?? 0);
  return (
    <LiveHarness
      sceneId={first(q.scene) ?? ""}
      presetId={first(q.preset)}
      w={int(first(q.w), 1920)}
      h={int(first(q.h), 1080)}
      phase={Number.isFinite(phase) ? Math.min(Math.max(phase, 0), 1) : 0}
    />
  );
}
