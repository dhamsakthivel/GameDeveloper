import type { Articulation } from "./articulation";

export type SoundStep = {
  id: string;
  label: string;
  speak: string;
  detail: string;
  targets: Articulation[];
};

export type WordPuzzle = {
  id: "red" | "church";
  title: string;
  ipa: string;
  speak: string;
  steps: SoundStep[];
};

/** Bunched American r: tongue body humped toward the palate, tip down. */
const rBunched: Articulation = {
  jaw: 0.32,
  tongueFront: 0.26,
  tongueHeight: 0.8,
  tongueTip: 0.1,
  lipRound: 0.5,
  constriction: 0.64,
  nasality: 0,
};

/** Retroflex American r: tongue tip curled back, lips a little round. */
const rRetroflex: Articulation = {
  jaw: 0.34,
  tongueFront: 0.4,
  tongueHeight: 0.46,
  tongueTip: 0.94,
  lipRound: 0.52,
  constriction: 0.6,
  nasality: 0,
};

const eAsInRed: Articulation = {
  jaw: 0.58,
  tongueFront: 0.82,
  tongueHeight: 0.5,
  tongueTip: 0.1,
  lipRound: 0.1,
  constriction: 0.12,
  nasality: 0,
};

const dAsInRed: Articulation = {
  jaw: 0.2,
  tongueFront: 0.74,
  tongueHeight: 0.32,
  tongueTip: 0.46,
  lipRound: 0.14,
  constriction: 0.98,
  nasality: 0,
};

const ch: Articulation = {
  jaw: 0.24,
  tongueFront: 0.64,
  tongueHeight: 0.44,
  tongueTip: 0.66,
  lipRound: 0.64,
  constriction: 0.88,
  nasality: 0,
};

const urBunched: Articulation = {
  jaw: 0.46,
  tongueFront: 0.28,
  tongueHeight: 0.76,
  tongueTip: 0.12,
  lipRound: 0.56,
  constriction: 0.54,
  nasality: 0,
};

const urRetroflex: Articulation = {
  jaw: 0.48,
  tongueFront: 0.4,
  tongueHeight: 0.44,
  tongueTip: 0.92,
  lipRound: 0.58,
  constriction: 0.52,
  nasality: 0,
};

export const WORDS: WordPuzzle[] = [
  {
    id: "red",
    title: "Red",
    ipa: "/ɹɛd/",
    speak: "red",
    steps: [
      {
        id: "r",
        label: "r",
        speak: "rrr",
        detail: "The tongue bunches toward the roof, or the tip curls back. The lips are a little round. Air keeps moving.",
        targets: [rBunched, rRetroflex],
      },
      {
        id: "e",
        label: "e",
        speak: "eh",
        detail: "The jaw is partly open. The tongue sits front and mid. The lips spread.",
        targets: [eAsInRed],
      },
      {
        id: "d",
        label: "d",
        speak: "duh",
        detail: "The tongue tip seals on the ridge behind the upper teeth, then lets go.",
        targets: [dAsInRed],
      },
    ],
  },
  {
    id: "church",
    title: "Church",
    ipa: "/tʃɝtʃ/",
    speak: "church",
    steps: [
      {
        id: "ch-1",
        label: "ch",
        speak: "ch",
        detail: "The tongue blade presses just behind the ridge and the lips push forward. Air squeezes through a groove.",
        targets: [ch],
      },
      {
        id: "ur",
        label: "ur",
        speak: "er",
        detail: "The tongue holds an r shape and the jaw sits a little more open.",
        targets: [urBunched, urRetroflex],
      },
      {
        id: "ch-2",
        label: "ch",
        speak: "ch",
        detail: "The tongue blade presses just behind the ridge and the lips push forward. Air squeezes through a groove.",
        targets: [ch],
      },
    ],
  },
];

export function wordById(id: WordPuzzle["id"]): WordPuzzle {
  const word = WORDS.find((entry) => entry.id === id);
  if (!word) throw new Error(`Unknown word ${id}`);
  return word;
}
