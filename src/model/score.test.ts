import { describe, expect, it } from "vitest";
import { lerpArticulation, NEUTRAL, type Articulation } from "./articulation";
import { scoreArticulation } from "./score";
import { wordById } from "./targets";

const red = wordById("red");
const rTargets = red.steps[0].targets;
const eTarget = red.steps[1].targets[0];
const dTarget = red.steps[2].targets[0];

describe("scoreArticulation", () => {
  it("locks an exact target at 100%", () => {
    const score = scoreArticulation(dTarget, [dTarget]);
    expect(score.locked).toBe(true);
    expect(score.percent).toBe(100);
    expect(score.bestIndex).toBe(0);
  });

  it("accepts both American r shapes and rejects the other shape", () => {
    const bunched = scoreArticulation(rTargets[0], rTargets);
    const curled = scoreArticulation(rTargets[1], rTargets);
    expect(bunched.locked).toBe(true);
    expect(bunched.bestIndex).toBe(0);
    expect(curled.locked).toBe(true);
    expect(curled.bestIndex).toBe(1);
    expect(scoreArticulation(rTargets[0], [rTargets[1]]).locked).toBe(false);
  });

  it("ignores the nose slider on an oral sound", () => {
    const nasalized: Articulation = { ...dTarget, nasality: 1 };
    expect(scoreArticulation(nasalized, [dTarget]).locked).toBe(true);
  });

  it("requires the nose slider when the target is nasal", () => {
    const nasal: Articulation = { ...dTarget, nasality: 1, constriction: 0.96 };
    expect(scoreArticulation({ ...nasal, nasality: 0 }, [nasal]).locked).toBe(false);
    expect(scoreArticulation(nasal, [nasal]).locked).toBe(true);
    expect(scoreArticulation({ ...nasal, nasality: 0 }, [nasal]).hint).toBe("nose");
  });

  it("starts far from the answer and climbs as the sliders approach it", () => {
    const start = scoreArticulation(NEUTRAL, [dTarget]);
    expect(start.locked).toBe(false);
    expect(start.percent).toBeLessThan(45);

    const far: Articulation = {
      ...dTarget,
      tongueFront: 0,
      tongueTip: 0,
      jaw: 1,
      constriction: 0,
      lipRound: 1,
    };
    let previous = scoreArticulation(far, [dTarget]).distance;
    for (const step of [0.25, 0.5, 0.75, 1]) {
      const next = scoreArticulation(lerpArticulation(far, dTarget, step), [dTarget]).distance;
      expect(next).toBeLessThan(previous);
      previous = next;
    }
  });

  it("names a region and not a direction", () => {
    const score = scoreArticulation({ ...eTarget, tongueHeight: 0, tongueFront: 0, tongueTip: 0.9 }, [eTarget]);
    expect(score.hint).toBe("tongue");
    expect(score.locked).toBe(false);
  });
});
