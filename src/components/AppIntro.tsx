import type { ReactNode } from "react";

interface Props {
  title: ReactNode;
  children: ReactNode;
  /** A still of what the app shows, for crawlers and visitors without JavaScript. */
  poster?: { src: string; width: number; height: number; alt: string };
}

/**
 * The server-rendered heading and summary above a client-only app (/studio, /live/<scene>).
 * The app itself reads the URL, so it renders in the browser; this keeps the page's h1, copy and
 * a still image in the HTML.
 */
export function AppIntro({ title, children, poster }: Props) {
  return (
    <section className="app-intro">
      <div className="container app-intro-row">
        <div>
          <h1>{title}</h1>
          <p>{children}</p>
        </div>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element -- a fixed-size poster from /public, no optimiser needed
          <img className="app-intro-poster" src={poster.src} width={poster.width} height={poster.height} alt={poster.alt} fetchPriority="high" decoding="async" />
        )}
      </div>
    </section>
  );
}

/** Suspense fallback with the app's own height, so the footer doesn't jump when the app mounts. */
export function StageSkeleton({ label }: { label: string }) {
  return (
    <div className="stage-skeleton" role="status">
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
