"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ParamValue } from "@/generators/types";
import { LIVE_SCENES, getLiveScene, resolveLiveParams } from "@/live";
import { decodeLiveState, liveHref, type LiveState } from "@/lib/liveState";
import { useDebounced } from "@/lib/useDebounced";
import { DevicePicker } from "./DevicePicker";
import { LiveStage } from "./LiveStage";
import { ParamsPanel } from "./ParamsPanel";

/** The /live/[id] page body: the playing scene on the left, presets and controls on the right. */
export function LivePlayerView({ sceneId }: { sceneId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [state, setState] = useState<LiveState>(() => decodeLiveState(sceneId, new URLSearchParams(search.toString())));
  const [toast, setToast] = useState("");

  const scene = getLiveScene(state.scene) ?? LIVE_SCENES[0]!;
  const params = useMemo(() => resolveLiveParams(scene, state.preset, state.overrides), [scene, state.preset, state.overrides]);

  // Keep the URL shareable. Debounced so dragging a slider doesn't navigate on every step.
  const debounced = useDebounced(state, 250);
  useEffect(() => {
    const href = liveHref(debounced);
    if (href !== `${window.location.pathname}${window.location.search}`) router.replace(href, { scroll: false });
  }, [debounced, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const setParam = useCallback((key: string, value: ParamValue) => {
    setState((s) => ({ ...s, overrides: { ...s.overrides, [key]: value } }));
  }, []);

  const pickPreset = (preset: string) => setState((s) => ({ ...s, preset, overrides: {} }));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${liveHref(state)}`);
      setToast("Share link copied");
    } catch {
      setToast("Couldn't access the clipboard");
    }
  };

  const presetTitle = scene.presets.find((p) => p.id === state.preset)?.title ?? state.preset;

  return (
    <div className="studio live-studio">
      <section className="studio-stage" aria-label="Preview">
        <div className="stage-bar">
          <div className="stage-title">
            <h1>{scene.name}</h1>
            <p>{presetTitle} · {state.w}×{state.h}</p>
          </div>
          <div className="actions">
            <button type="button" className="btn" onClick={copyLink}>
              Copy link
            </button>
          </div>
        </div>

        <LiveStage scene={scene} preset={state.preset} params={params} w={state.w} h={state.h} />

        <div className="stage-bar">
          <p className="preview-dims">
            Loops every {scene.loopSeconds} s. Seed {String(params.seed)} gives the same motion every time.
          </p>
        </div>
      </section>

      <aside className="studio-col params-col" aria-label="Controls">
        <section className="col-section">
          <span className="label">Presets</span>
          <div className="live-presets">
            {scene.presets.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={p.id === state.preset} onClick={() => pickPreset(p.id)}>
                {p.title}
              </button>
            ))}
          </div>
        </section>
        <section className="col-section">
          <span className="label">Device</span>
          <DevicePicker device={state.device} w={state.w} h={state.h} onChange={(device, w, h) => setState((s) => ({ ...s, device, w, h }))} />
        </section>
        <section className="col-section">
          <ParamsPanel gen={scene} params={params} onChange={setParam} />
          <button type="button" className="btn btn-sm btn-block" onClick={() => pickPreset(state.preset)}>
            Reset to preset
          </button>
        </section>
      </aside>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
