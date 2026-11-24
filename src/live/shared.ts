import type { Params } from "@/generators/types";
import type { AnyLiveScene } from "./types";

/** The part of a LivePlayer the shared controller drives. */
export interface SharedPlayable {
  start(): void;
  stop(): void;
  setParams(p: Params): void;
  dispose(): void;
}

/** Builds a player for `scene`, or returns null when it can't play (no WebGL2, shader error). */
export type SharedPlayerFactory = (scene: AnyLiveScene, params: Params) => SharedPlayable | null;

export interface SharedPlayer {
  /** Plays `scene` with `params`. Returns false when the factory couldn't build a player. */
  show(scene: AnyLiveScene, params: Params): boolean;
  /** Stops playing. The player is kept, so showing the same shader again doesn't recompile. */
  hide(): void;
  /** Disposes the player for good. */
  dispose(): void;
}

/**
 * One player for a whole page of cards, so the page never holds more than one WebGL context.
 * Showing the same shader again only rebinds params; a different shader disposes the old
 * player before the factory builds the next one. The factory draws on one canvas, so the
 * player's per-context program cache means a shader seen before links no new program.
 */
export function createSharedPlayer(factory: SharedPlayerFactory): SharedPlayer {
  let current: { fragment: string; player: SharedPlayable } | null = null;

  const drop = () => {
    current?.player.dispose();
    current = null;
  };

  return {
    show(scene, params) {
      if (current && current.fragment === scene.fragment) {
        current.player.setParams(params);
      } else {
        drop();
        const player = factory(scene, params);
        if (!player) return false;
        current = { fragment: scene.fragment, player };
      }
      current.player.start();
      return true;
    },
    hide() {
      current?.player.stop();
    },
    dispose: drop,
  };
}

export interface HoverIntent {
  /** The pointer entered card `id`: activate it once the pointer has rested for the delay. */
  enter(id: string): void;
  /** The pointer left card `id`: drop its pending activation, if it has one. */
  leave(id: string): void;
  /** Activate `id` at once (keyboard focus), dropping any pending hover. */
  now(id: string): void;
  /** Drop any pending activation. */
  cancel(): void;
}

/**
 * Hover intent for the /live grid: a card only starts playing once the pointer rests on it for
 * `delayMs`, so sweeping across the grid doesn't build a player for every card it crosses.
 */
export function createHoverIntent(delayMs: number, activate: (id: string) => void): HoverIntent {
  let pending: { id: string; timer: ReturnType<typeof setTimeout> } | null = null;
  const cancel = () => {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  };
  return {
    enter(id) {
      cancel();
      const timer = setTimeout(() => {
        pending = null;
        activate(id);
      }, delayMs);
      pending = { id, timer };
    },
    leave(id) {
      if (pending?.id === id) cancel();
    },
    now(id) {
      cancel();
      activate(id);
    },
    cancel,
  };
}
