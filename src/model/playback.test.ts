import { describe, expect, it } from "vitest";
import type { Articulation } from "./articulation";
import { playbackDuration, poseAt } from "./playback";

const a: Articulation = {
  jaw: 0,
  tongueFront: 0,
  tongueHeight: 0,
  tongueTip: 0,
  lipRound: 0,
  constriction: 0,
  nasality: 0,
};
const b: Articulation = { ...a, jaw: 1, tongueTip: 1 };
const c: Articulation = { ...a, lipRound: 1, constriction: 1 };

describe("poseAt", () => {
  it("holds the first pose, blends, and finishes on the last pose", () => {
    const timing = { hold: 100, blend: 100 };
    expect(poseAt([a, b, c], 0, timing).pose).toEqual(a);
    expect(poseAt([a, b, c], 100, timing).pose.jaw).toBe(0);
    const mid = poseAt([a, b, c], 150, timing);
    expect(mid.index).toBe(0);
    expect(mid.pose.jaw).toBeGreaterThan(0.4);
    expect(mid.pose.jaw).toBeLessThan(0.8);
    const end = poseAt([a, b, c], playbackDuration(3, timing), timing);
    expect(end.done).toBe(true);
    expect(end.pose).toEqual(c);
  });

  it("jumps between poses when blend time is zero", () => {
    const timing = { hold: 80, blend: 0 };
    expect(poseAt([a, b], 79, timing).pose).toEqual(a);
    expect(poseAt([a, b], 80, timing).pose).toEqual(b);
  });
});
