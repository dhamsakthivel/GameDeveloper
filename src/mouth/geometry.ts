import type { Articulation } from "../model/articulation";
import {
  catmullRom,
  clamp,
  lerp,
  lerpPoint,
  type Point,
  rotateAround,
  samplePolyline,
  smoothClosed,
  smoothstep,
} from "./math";

export type Place = "lip" | "tip" | "body";

export type MouthGeometry = {
  place: Place;
  lipAperture: number;
  minTonguePalateGap: number;
  narrowest: Point & { gap: number };
  contact: Point | null;
  upperTongue: Point[];
  cavity: string;
  nasal: string;
  velum: string;
  tongue: string;
  hook: string | null;
  upperTeeth: string;
  lowerTeeth: string;
  upperLip: string;
  lowerLip: string;
  upperHead: string;
};

const HINGE: Point = { x: 312, y: 246 };
const JAW_OPEN = 0.24;
const BACK_WALL_X = 372;
const DORSUM_RADIUS = 24;
const TIP_RADIUS = 8;

const HARD_PALATE: Point[] = [
  { x: 118, y: 168 },
  { x: 134, y: 150 },
  { x: 156, y: 128 },
  { x: 188, y: 110 },
  { x: 226, y: 100 },
  { x: 268, y: 106 },
  { x: 300, y: 122 },
];

/** Which articulator the opening slider is allowed to squeeze. */
export function activePlace(articulation: Articulation): Place {
  if (articulation.tongueTip >= 0.34) return "tip";
  if (articulation.tongueHeight >= 0.6 && articulation.tongueFront <= 0.72) return "body";
  if (articulation.constriction >= 0.5 && articulation.tongueHeight <= 0.55) return "lip";
  if (articulation.tongueHeight > 0.66) return "body";
  return "lip";
}

/** Pixel gap left when the active articulator is fully engaged. */
export function targetAirGap(constriction: number): number {
  return 34 * Math.pow(1 - clamp(constriction, 0, 1), 1.45);
}

function palateLine(nasality: number): Point[] {
  const lift = clamp(nasality, 0, 1);
  return [
    ...HARD_PALATE,
    { x: lerp(328, 342, lift), y: lerp(146, 108, lift) },
    { x: lerp(348, 358, lift), y: lerp(176, 96, lift) },
  ];
}

function upwardNormal(prev: Point, next: Point, fallback: Point): Point {
  let tx = next.x - prev.x;
  let ty = next.y - prev.y;
  const length = Math.hypot(tx, ty);
  if (length < 0.001) return fallback;
  tx /= length;
  ty /= length;
  let nx = -ty;
  let ny = tx;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: nx, y: ny };
}

function radiusAlong(t: number): number {
  if (t < 0.62) return lerp(28, 22, t / 0.62);
  if (t < 0.84) return lerp(22, 12, (t - 0.62) / 0.22);
  return lerp(12, TIP_RADIUS, (t - 0.84) / 0.16);
}

function tipAndBlade(articulation: Articulation, palate: Point[], jawDrop: number): { blade: Point; tip: Point } {
  const py = (x: number) => samplePolyline(palate, x);
  const tipAmount = articulation.tongueTip;
  if (tipAmount < 0.7) {
    const k = smoothstep(clamp(tipAmount / 0.7, 0, 1));
    const x = lerp(108, 158, k);
    const y = lerp(214 + jawDrop * 0.85, py(x) + 8, k);
    return {
      tip: { x, y },
      blade: {
        x: lerp(150, x + 6, k),
        y: lerp(206 + jawDrop * 0.7, py(Math.min(x + 14, 200)) + 18, k),
      },
    };
  }
  const retro = smoothstep(clamp((tipAmount - 0.7) / 0.3, 0, 1));
  const bladeX = lerp(156, 138, retro);
  const tipX = lerp(168, 214, retro);
  return {
    blade: { x: bladeX, y: py(bladeX) + lerp(24, 40, retro) },
    tip: {
      x: tipX,
      y: py(Math.min(tipX, 230)) + lerp(16, 12, retro),
    },
  };
}

function controlPoints(articulation: Articulation, palate: Point[]): Point[] {
  const py = (x: number) => samplePolyline(palate, x);
  const jawDrop = articulation.jaw * 32;
  const place = activePlace(articulation);
  const gap = targetAirGap(articulation.constriction);
  const pull = clamp((articulation.constriction - 0.04) / 0.72, 0, 1);

  const dorsumX = lerp(292, 162, articulation.tongueFront);
  const ceiling = py(dorsumX);
  const restGap = lerp(62, 12, articulation.tongueHeight) + articulation.jaw * 14;
  let dorsumSurface = ceiling + restGap;
  if (place === "body") {
    dorsumSurface = lerp(dorsumSurface, ceiling + gap, pull);
  }
  const dorsum = { x: dorsumX, y: dorsumSurface + DORSUM_RADIUS };

  const root = { x: 334, y: 268 + jawDrop * 0.35 };
  const back = {
    x: lerp(root.x, dorsum.x, 0.5),
    y: lerp(root.y, dorsum.y, 0.42) + 8,
  };
  if (place === "body") {
    const backLimit = py(back.x) + gap + 30;
    back.y = Math.max(backLimit, lerp(back.y, backLimit, pull * 0.7));
  }

  let { blade, tip } = tipAndBlade(articulation, palate, jawDrop);
  if (place === "tip") {
    const tipLimit = py(clamp(tip.x, palate[0].x + 4, palate[palate.length - 2].x)) + gap + TIP_RADIUS;
    tip = { ...tip, y: Math.max(tipLimit, lerp(tip.y, tipLimit, pull)) };
    const retroflex = articulation.tongueTip > 0.7;
    const bladeLimit = py(clamp(blade.x, palate[0].x, 280)) + gap + (retroflex ? 30 : 14);
    blade = { ...blade, y: Math.max(bladeLimit, lerp(blade.y, bladeLimit, pull * (retroflex ? 0.35 : 0.85))) };
  }

  return [root, back, dorsum, blade, tip];
}

function tongueOutline(center: Point[], palate: Point[], minGap: number): { upper: Point[]; lower: Point[] } {
  const upper: Point[] = [];
  const lower: Point[] = [];
  let normal = { x: 0, y: -1 };
  for (let i = 0; i < center.length; i += 1) {
    const prev = center[Math.max(0, i - 1)];
    const next = center[Math.min(center.length - 1, i + 1)];
    normal = upwardNormal(prev, next, normal);
    const radius = radiusAlong(i / (center.length - 1));
    const point = center[i];
    let topY = point.y + normal.y * radius;
    const topX = point.x + normal.x * radius;
    if (topX >= palate[0].x && topX <= palate[palate.length - 1].x) {
      const ceiling = samplePolyline(palate, topX) + minGap;
      if (topY < ceiling) topY = ceiling;
    }
    upper.push({ x: topX, y: topY });
    lower.push({
      x: point.x - normal.x * radius * 0.82,
      y: point.y - normal.y * radius * 0.82,
    });
  }
  return { upper, lower };
}

function lipPose(articulation: Articulation, place: Place): {
  aperture: number;
  upper: Point[];
  lower: Point[];
} {
  const angle = -articulation.jaw * JAW_OPEN;
  const protrude = articulation.lipRound * 14;
  const close = place === "lip" ? articulation.constriction : articulation.constriction * 0.05;

  const upper: Point[] = [
    { x: 46 - protrude, y: 156 },
    { x: 68 - protrude * 0.3, y: 142 },
    { x: 102, y: 154 },
    { x: 92, y: 176 },
    { x: 60 - protrude * 0.15, y: 170 },
  ];

  const lowerRest: Point[] = [
    { x: 52, y: 184 },
    { x: 96, y: 192 },
    { x: 104, y: 212 },
    { x: 48, y: 210 },
  ];
  const lowerSwung = lowerRest.map((point) => rotateAround(point, HINGE, angle));
  const upperInner = upper[3];
  const lower = lowerSwung.map((point, index) => {
    const pulled = lerpPoint(
      point,
      { x: upperInner.x - 1, y: upperInner.y + 1.2 },
      Math.min(1, close * (index < 2 ? 1 : 0.7)),
    );
    return { x: pulled.x - protrude * (index === 0 ? 1 : 0.35), y: pulled.y };
  });

  const aperture = Math.max(0, lower[0].y - upper[3].y);
  return { aperture, upper, lower };
}

function faceOutline(articulation: Articulation, upperLip: Point[], lowerLip: Point[]): Point[] {
  const angle = -articulation.jaw * JAW_OPEN;
  const swing = (point: Point) => rotateAround(point, HINGE, angle);
  const mandible = [
    { x: 186, y: 292 },
    { x: 140, y: 312 },
    { x: 96, y: 304 },
    { x: 66, y: 270 },
    { x: 50, y: 236 },
    lowerLip[0],
  ].map((point, index) => (index === 5 ? point : swing(point)));

  return [
    { x: 168, y: 32 },
    { x: 408, y: 32 },
    { x: 408, y: 390 },
    { x: 214, y: 390 },
    { x: 196, y: 348 },
    { x: 188, y: 308 },
    ...mandible,
    { x: 62, y: 188 },
    upperLip[0],
    { x: 34, y: 142 },
    { x: 62, y: 118 },
    { x: 96, y: 126 },
    { x: 88, y: 104 },
    { x: 124, y: 86 },
    { x: 156, y: 58 },
  ];
}

function jawLimitY(x: number, jaw: number): number {
  const angle = -jaw * JAW_OPEN;
  const samples = [
    rotateAround({ x: 108, y: 224 }, HINGE, angle),
    rotateAround({ x: 180, y: 280 }, HINGE, angle),
    rotateAround({ x: 260, y: 304 }, HINGE, angle),
    { x: 370, y: 308 },
  ].sort((a, b) => a.x - b.x);
  return samplePolyline(samples, x) - 6;
}

function tongueMass(upper: Point[], jaw: number): Point[] {
  const tip = upper[upper.length - 1];
  const root = upper[0];
  const span = root.x - tip.x || 1;
  const floor = [...upper].reverse().map((point) => {
    const along = clamp((point.x - tip.x) / span, 0, 1);
    const wanted = point.y + lerp(22, 96, along);
    const limit = jawLimitY(point.x, jaw);
    return { x: point.x + 2, y: Math.min(wanted, Math.max(limit, point.y + 14)) };
  });
  return [...upper, ...floor];
}

/** A curled tip folds back on itself. Keep the mass solid and draw the curl as a thick stroke. */
function splitCurl(upper: Point[], palate: Point[], tongueTip: number): { body: Point[]; hook: string | null } {
  let front = 0;
  for (let index = 1; index < upper.length; index += 1) {
    if (upper[index].x < upper[front].x) front = index;
  }
  const curled = tongueTip > 0.72 && upper.slice(front).some((point, index) => index > 0 && point.x > upper[front].x + 8);
  if (!curled) return { body: upper, hook: null };
  const curl = clamp((tongueTip - 0.72) / 0.28, 0, 1);
  const py = (x: number) => samplePolyline(palate, x);
  const start = upper[front];
  const tip = { x: lerp(178, 208, curl), y: py(lerp(170, 194, curl)) + 12 };
  const hook = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${(start.x + 18).toFixed(1)} ${(py(start.x) + 8).toFixed(1)}, ${(tip.x - 20).toFixed(1)} ${(tip.y - 4).toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
  return { body: upper.slice(0, front + 1), hook };
}

function teeth(articulation: Articulation): { upper: string; lower: string } {
  const upper = smoothClosed([
    { x: 108, y: 154 },
    { x: 134, y: 150 },
    { x: 132, y: 186 },
    { x: 106, y: 184 },
  ]);
  const angle = -articulation.jaw * JAW_OPEN;
  const lower = smoothClosed(
    [
      { x: 108, y: 192 },
      { x: 132, y: 190 },
      { x: 130, y: 214 },
      { x: 106, y: 212 },
    ].map((point) => rotateAround(point, HINGE, angle)),
  );
  return { upper, lower };
}

function clearance(upper: Point[], palate: Point[]): { min: number; narrowest: Point & { gap: number } } {
  let min = Number.POSITIVE_INFINITY;
  let narrowest: Point & { gap: number } = { x: upper[0].x, y: upper[0].y, gap: min };
  for (const point of upper) {
    if (point.x < palate[0].x || point.x > palate[palate.length - 1].x) continue;
    const gap = point.y - samplePolyline(palate, point.x);
    if (gap < min) {
      min = gap;
      narrowest = { x: point.x, y: point.y, gap };
    }
  }
  if (!Number.isFinite(min)) min = 0;
  return { min, narrowest };
}

export function buildMouth(articulation: Articulation): MouthGeometry {
  const palate = palateLine(articulation.nasality);
  const place = activePlace(articulation);
  const controls = controlPoints(articulation, palate);
  const center = catmullRom(controls, 8);
  const channel = targetAirGap(articulation.constriction);
  const minGap = articulation.constriction >= 0.93 ? 0 : Math.min(channel, 16);
  const { upper } = tongueOutline(center, palate, minGap);
  const { min, narrowest } = clearance(upper, palate);
  const contact =
    min < 1.35 && articulation.constriction > 0.8 ? { x: narrowest.x, y: narrowest.y } : null;
  const lips = lipPose(articulation, place);
  const tooth = teeth(articulation);

  const root = upper[0];
  const tip = upper[upper.length - 1];
  const cavity = smoothClosed([
    { x: lips.upper[0].x + 10, y: lips.upper[3].y - 2 },
    lips.upper[3],
    { x: 112, y: 168 },
    ...palate,
    { x: BACK_WALL_X, y: palate[palate.length - 1].y + 6 },
    { x: BACK_WALL_X, y: Math.max(root.y + 8, 268) },
    { x: root.x + 4, y: root.y },
    ...upper,
    { x: Math.max(tip.x, 124), y: tip.y + 4 },
    lips.lower[1],
  ]);

  const nasal = smoothClosed([
    { x: 178, y: 92 },
    { x: 214, y: 64 },
    { x: 268, y: 58 },
    { x: 324, y: 76 },
    { x: 318, y: 112 },
    { x: 260, y: 104 },
    { x: 206, y: 112 },
  ]);

  const palateRoof = palate.map((point, index) => ({
    x: point.x,
    y: point.y - lerp(16, 26, index / (palate.length - 1)),
  }));
  const velum = smoothClosed([...palate, ...palateRoof.reverse()]);
  const curl = splitCurl(upper, palate, articulation.tongueTip);
  const tongue = smoothClosed(tongueMass(curl.body, articulation.jaw));
  const upperHead = smoothClosed(faceOutline(articulation, lips.upper, lips.lower));

  return {
    place,
    lipAperture: lips.aperture,
    minTonguePalateGap: min,
    narrowest,
    contact,
    upperTongue: upper,
    cavity,
    nasal,
    velum,
    tongue,
    hook: curl.hook,
    upperTeeth: tooth.upper,
    lowerTeeth: tooth.lower,
    upperLip: smoothClosed(lips.upper),
    lowerLip: smoothClosed(lips.lower),
    upperHead,
  };
}
