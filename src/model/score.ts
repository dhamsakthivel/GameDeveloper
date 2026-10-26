import { SLIDER_KEYS, type Articulation, type SliderKey } from "./articulation";

export type HintRegion = "jaw" | "tongue" | "lips" | "opening" | "nose";

export type Score = {
  percent: number;
  distance: number;
  locked: boolean;
  bestIndex: number;
  hint: HintRegion | null;
};

const WEIGHTS: Record<SliderKey, number> = {
  jaw: 0.85,
  tongueFront: 1.3,
  tongueHeight: 1.3,
  tongueTip: 1.45,
  lipRound: 1.15,
  constriction: 1.05,
  nasality: 0,
};

const TOLERANCE: Record<SliderKey, number> = {
  jaw: 0.1,
  tongueFront: 0.08,
  tongueHeight: 0.08,
  tongueTip: 0.08,
  lipRound: 0.1,
  constriction: 0.08,
  nasality: 0.12,
};

const DISTANCE_AT_ZERO = 0.5;

const GROUPS: Record<HintRegion, SliderKey[]> = {
  jaw: ["jaw"],
  tongue: ["tongueFront", "tongueHeight", "tongueTip"],
  lips: ["lipRound"],
  opening: ["constriction"],
  nose: ["nasality"],
};

function weightFor(key: SliderKey, target: Articulation): number {
  if (key === "nasality") return target.nasality >= 0.45 ? 1.25 : 0;
  return WEIGHTS[key];
}

function weightedDistance(player: Articulation, target: Articulation): number {
  let sum = 0;
  let weightSum = 0;
  for (const key of SLIDER_KEYS) {
    const weight = weightFor(key, target);
    if (weight === 0) continue;
    const delta = player[key] - target[key];
    sum += weight * delta * delta;
    weightSum += weight;
  }
  if (weightSum === 0) return 0;
  return Math.sqrt(sum / weightSum);
}

function withinLock(player: Articulation, target: Articulation): boolean {
  for (const key of SLIDER_KEYS) {
    if (weightFor(key, target) === 0) continue;
    if (Math.abs(player[key] - target[key]) > TOLERANCE[key]) return false;
  }
  return true;
}

function hintFor(player: Articulation, target: Articulation): HintRegion | null {
  let best: HintRegion | null = null;
  let bestError = 0;
  for (const region of Object.keys(GROUPS) as HintRegion[]) {
    let sum = 0;
    let weightSum = 0;
    for (const key of GROUPS[region]) {
      const weight = weightFor(key, target);
      if (weight === 0) continue;
      sum += weight * Math.abs(player[key] - target[key]);
      weightSum += weight;
    }
    if (weightSum === 0) continue;
    const error = sum / weightSum;
    if (error > bestError + 0.0001) {
      bestError = error;
      best = region;
    }
  }
  return best;
}

export function scoreArticulation(player: Articulation, targets: Articulation[]): Score {
  let bestIndex = 0;
  let distance = Number.POSITIVE_INFINITY;
  targets.forEach((target, index) => {
    const next = weightedDistance(player, target);
    if (next < distance) {
      distance = next;
      bestIndex = index;
    }
  });
  const target = targets[bestIndex];
  const locked = withinLock(player, target);
  const percent = locked
    ? 100
    : Math.round(100 * (1 - Math.min(1, distance / DISTANCE_AT_ZERO)));
  return {
    percent,
    distance,
    locked,
    bestIndex,
    hint: locked ? null : hintFor(player, target),
  };
}

export const HINT_COPY: Record<HintRegion, string> = {
  jaw: "The jaw is off.",
  tongue: "The tongue is off.",
  lips: "The lips are off.",
  opening: "The opening is off.",
  nose: "The nose is off.",
};
