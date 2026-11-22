"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { getGenerator } from "@/generators";
import { studioLinkFor, type GalleryItem } from "@/lib/gallery";
import { trackDownload } from "@/lib/analytics";

interface Props {
  item: GalleryItem | null;
  onClose: () => void;
}

/** Can a closing dialog stay in the top layer while it animates out? (Chromium can; others need help.) */
function canAnimateClose(): boolean {
  if (!window.CSS?.supports?.("overlay", "auto") || !CSS.supports("transition-behavior", "allow-discrete")) return false;
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  const ok = getComputedStyle(probe).display === "block";
  probe.remove();
  return ok;
}

/** Plays the exit transition, then closes. Where the browser can't, data-closing runs it first. */
async function closeAnimated(d: HTMLDialogElement) {
  if (!canAnimateClose()) {
    d.setAttribute("data-closing", "");
    const running = d.getAnimations({ subtree: true });
    if (running.length) {
      await Promise.race([Promise.allSettled(running.map((a) => a.finished)), new Promise((r) => setTimeout(r, 600))]);
    }
    d.removeAttribute("data-closing");
  }
  d.close();
}

export function WallpaperDialog({ item, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Keep showing the last item while the dialog animates closed.
  const last = useRef<GalleryItem | null>(item);
  if (item) last.current = item;
  const shown = item ?? last.current;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) void closeAnimated(d);
  }, [item]);

  const studio = shown ? studioLinkFor(shown) : null;
  const gen = shown ? getGenerator(shown.generator) : undefined;
  const fullPreview = shown?.source === "drive" ? shown.previewUrl.replace(/sz=w\d+/, "sz=w1800") : shown?.previewUrl;

  return (
    <dialog
      ref={ref}
      className="wp-dialog"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="wp-dialog-title"
    >
      {shown && (
        <div className="dialog-body">
          <div className="dialog-media">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Drive thumbnails */}
            <img src={fullPreview} alt={shown.title} referrerPolicy="no-referrer" />
          </div>
          <div className="dialog-side">
            <div>
              <span className="eyebrow">{shown.source === "drive" ? "Cutting Mat pack" : gen?.name ?? shown.generator}</span>
              <h2 id="wp-dialog-title">{shown.title}</h2>
            </div>
            <dl>
              <dt>Size</dt>
              <dd>{shown.width}×{shown.height}</dd>
              <dt>Generator</dt>
              <dd>{gen?.name ?? shown.generator}</dd>
              <dt>Text</dt>
              <dd>{shown.hasTextFree ? "Text-free" : "With text"}</dd>
              <dt>Tags</dt>
              <dd>{shown.tags.join(", ")}</dd>
            </dl>
            <a className="btn btn-primary btn-block" href={shown.downloadUrl} download target={shown.source === "drive" ? "_blank" : undefined} rel="noreferrer"
              onClick={() => trackDownload({ source: "gallery", format: "png", generator: shown.generator, width: shown.width, height: shown.height })}>
              Download PNG
            </a>
            {studio ? (
              <Link className="btn btn-block" href={studio}>
                Open in Studio
              </Link>
            ) : (
              <Link className="btn btn-block" href={`/studio?g=cutting-mat&p=shadow-grey${shown.height > shown.width ? "&d=iphone" : ""}`}>
                Make one like this
              </Link>
            )}
            <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
