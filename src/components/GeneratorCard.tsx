import Link from "next/link";
import type { AnyGenerator } from "@/generators";
import { previewSize } from "@/lib/gallery";
import { posterFor } from "@/lib/galleryData";
import { LiveThumb } from "./LiveThumb";

export function GeneratorCard({ gen, isNew = false }: { gen: AnyGenerator; isNew?: boolean }) {
  const first = gen.presets[0];
  const label = `${gen.name}, ${first?.title ?? "default"} preset`;
  const sample = posterFor(gen.id, first?.id);
  const poster = sample && { src: sample.previewUrl, ...previewSize(sample), alt: `${gen.name} wallpaper, ${first?.title ?? "default"} preset` };
  return (
    <Link href={`/generators/${gen.id}`} className="card">
      <div className="card-media">
        <LiveThumb gen={gen.id} preset={first?.id} w={1600} h={1000} label={label} poster={poster} />
      </div>
      <div className="card-body">
        <h3>
          {gen.name}
          {isNew && <span className="new-tag">New</span>}
        </h3>
        <p>{gen.description}</p>
        <div className="card-meta">
          <span className="tag">{gen.presets.length} presets</span>
          <span className="tag">{Object.keys(gen.params).length} controls</span>
        </div>
      </div>
    </Link>
  );
}
