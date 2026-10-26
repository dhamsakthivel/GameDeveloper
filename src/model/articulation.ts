export const SLIDER_KEYS = [
  "jaw",
  "tongueFront",
  "tongueHeight",
  "tongueTip",
  "lipRound",
  "constriction",
  "nasality",
] as const;

export type SliderKey = (typeof SLIDER_KEYS)[number];

export type Articulation = Record<SliderKey, number>;

export type SliderSpec = {
  key: SliderKey;
  label: string;
  low: string;
  high: string;
  note?: string;
};

export const SLIDERS: SliderSpec[] = [
  { key: "jaw", label: "Jaw", low: "Closed", high: "Open" },
  { key: "tongueFront", label: "Tongue front", low: "Back", high: "Front" },
  { key: "tongueHeight", label: "Tongue height", low: "Low", high: "High" },
  { key: "tongueTip", label: "Tongue tip", low: "Down", high: "Curled" },
  { key: "lipRound", label: "Lips", low: "Spread", high: "Round" },
  { key: "constriction", label: "Opening", low: "Wide", high: "Sealed" },
  {
    key: "nasality",
    label: "Nose",
    low: "Shut",
    high: "Open",
    note: "Matters for m, n, and ng",
  },
];

export const NEUTRAL: Articulation = {
  jaw: 0.48,
  tongueFront: 0.46,
  tongueHeight: 0.34,
  tongueTip: 0.16,
  lipRound: 0.16,
  constriction: 0.12,
  nasality: 0,
};

export function cloneArticulation(source: Articulation): Articulation {
  return { ...source };
}

export function lerpArticulation(a: Articulation, b: Articulation, t: number): Articulation {
  const next = {} as Articulation;
  for (const key of SLIDER_KEYS) {
    next[key] = a[key] + (b[key] - a[key]) * t;
  }
  return next;
}
