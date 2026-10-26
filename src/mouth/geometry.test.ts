import { describe, expect, it } from "vitest";
import type { Articulation } from "../model/articulation";
import { wordById } from "../model/targets";
import { rotateAround } from "./math";
import { activePlace, buildMouth } from "./geometry";

const red = wordById("red");
const church = wordById("church");
const bunchedR = red.steps[0].targets[0];
const retroR = red.steps[0].targets[1];
const eVowel = red.steps[1].targets[0];
const dStop = red.steps[2].targets[0];
const ch = church.steps[0].targets[0];

const bilabial: Articulation = {
  jaw: 0.12,
  tongueFront: 0.42,
  tongueHeight: 0.28,
  tongueTip: 0.08,
  lipRound: 0.18,
  constriction: 0.98,
  nasality: 0,
};

describe("buildMouth", () => {
  it("keeps the tongue on the mouth side of the palate", () => {
    const values = [0, 0.5, 1];
    for (const jaw of values) {
      for (const tongueFront of values) {
        for (const tongueHeight of values) {
          for (const tongueTip of values) {
            for (const constriction of values) {
              const mouth = buildMouth({
                jaw,
                tongueFront,
                tongueHeight,
                tongueTip,
                lipRound: constriction,
                constriction,
                nasality: jaw,
              });
              expect(mouth.minTonguePalateGap).toBeGreaterThan(-0.6);
              expect(Number.isFinite(mouth.lipAperture)).toBe(true);
            }
          }
        }
      }
    }
  });

  it("seals an alveolar d on the tooth ridge and leaves the lips open", () => {
    const mouth = buildMouth(dStop);
    expect(mouth.place).toBe("tip");
    expect(mouth.contact).not.toBeNull();
    expect(mouth.contact!.x).toBeGreaterThan(120);
    expect(mouth.contact!.x).toBeLessThan(175);
    expect(mouth.lipAperture).toBeGreaterThan(8);
  });

  it("keeps a vowel open and a bilabial stop on the lips", () => {
    const vowel = buildMouth(eVowel);
    expect(vowel.contact).toBeNull();
    expect(vowel.minTonguePalateGap).toBeGreaterThan(16);
    expect(vowel.lipAperture).toBeGreaterThan(12);

    const stop = buildMouth(bilabial);
    expect(activePlace(bilabial)).toBe("lip");
    expect(stop.lipAperture).toBeLessThan(5);
    expect(stop.minTonguePalateGap).toBeGreaterThan(8);
    expect(stop.contact).toBeNull();
  });

  it("places bunched r farther back than a curled r, both with a narrow open channel", () => {
    const bunched = buildMouth(bunchedR);
    const curled = buildMouth(retroR);
    for (const mouth of [bunched, curled]) {
      expect(mouth.contact).toBeNull();
      expect(mouth.minTonguePalateGap).toBeGreaterThan(2);
      expect(mouth.minTonguePalateGap).toBeLessThan(18);
    }
    expect(bunched.narrowest.x).toBeGreaterThan(curled.narrowest.x);
    expect(bunched.narrowest.x).toBeGreaterThan(190);
  });

  it("grooves ch just behind the ridge without a full seal", () => {
    const mouth = buildMouth(ch);
    expect(mouth.place).toBe("tip");
    expect(mouth.contact).toBeNull();
    expect(mouth.minTonguePalateGap).toBeGreaterThan(1);
    expect(mouth.minTonguePalateGap).toBeLessThan(8);
    expect(mouth.narrowest.x).toBeGreaterThan(130);
    expect(mouth.narrowest.x).toBeLessThan(190);
    expect(mouth.lipAperture).toBeGreaterThan(4);
  });

  it("drops the chin as the jaw opens", () => {
    const hinge = { x: 312, y: 246 };
    const chin = { x: 78, y: 318 };
    const open = rotateAround(chin, hinge, -0.4);
    expect(open.y).toBeGreaterThan(chin.y);
  });
});
