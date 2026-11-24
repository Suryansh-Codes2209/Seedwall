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
 * player before the factory builds the next one.
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
