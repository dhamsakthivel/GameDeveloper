import { lerpArticulation, type Articulation } from "./articulation";

export type PlaybackTiming = {
  hold: number;
  blend: number;
};

export const DEFAULT_TIMING: PlaybackTiming = {
  hold: 340,
  blend: 210,
};

export type PlaybackFrame = {
  pose: Articulation;
  index: number;
  done: boolean;
};

export function playbackDuration(count: number, timing: PlaybackTiming = DEFAULT_TIMING): number {
  if (count <= 0) return 0;
  return count * timing.hold + Math.max(0, count - 1) * timing.blend;
}

export function poseAt(
  poses: Articulation[],
  elapsedMs: number,
  timing: PlaybackTiming = DEFAULT_TIMING,
): PlaybackFrame {
  if (poses.length === 0) {
    throw new Error("poseAt requires at least one pose");
  }
  const total = playbackDuration(poses.length, timing);
  if (elapsedMs >= total) {
    return { pose: poses[poses.length - 1], index: poses.length - 1, done: true };
  }
  let remaining = Math.max(0, elapsedMs);
  for (let index = 0; index < poses.length; index += 1) {
    if (remaining < timing.hold || index === poses.length - 1) {
      return { pose: poses[index], index, done: false };
    }
    remaining -= timing.hold;
    const blend = timing.blend;
    if (blend <= 0 || remaining <= blend) {
      const t = blend <= 0 ? 1 : remaining / blend;
      const smooth = t * t * (3 - 2 * t);
      return {
        pose: lerpArticulation(poses[index], poses[index + 1], smooth),
        index,
        done: false,
      };
    }
    remaining -= blend;
  }
  return { pose: poses[poses.length - 1], index: poses.length - 1, done: true };
}
