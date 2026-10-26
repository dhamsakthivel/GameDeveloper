export type Point = { x: number; y: number };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Screen-space rotation. A negative angle drops a point that sits left of the hinge. */
export function rotateAround(point: Point, hinge: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - hinge.x;
  const dy = point.y - hinge.y;
  return {
    x: hinge.x + dx * cos - dy * sin,
    y: hinge.y + dx * sin + dy * cos,
  };
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Closed shape with rounded corners. Keeps the polygon from looking faceted. */
export function smoothClosed(points: Point[]): string {
  const count = points.length;
  if (count < 3) return toPath(points, true);
  const commands = [`M ${round1(points[0].x)} ${round1(points[0].y)}`];
  for (let index = 0; index < count; index += 1) {
    const p0 = points[(index - 1 + count) % count];
    const p1 = points[index];
    const p2 = points[(index + 1) % count];
    const p3 = points[(index + 2) % count];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    commands.push(
      `C ${round1(c1.x)} ${round1(c1.y)} ${round1(c2.x)} ${round1(c2.y)} ${round1(p2.x)} ${round1(p2.y)}`,
    );
  }
  commands.push("Z");
  return commands.join(" ");
}

export function toPath(points: Point[], close = false): string {
  if (points.length === 0) return "";
  const head = `M ${round1(points[0].x)} ${round1(points[0].y)}`;
  const body = points
    .slice(1)
    .map((point) => `L ${round1(point.x)} ${round1(point.y)}`)
    .join(" ");
  return close ? `${head} ${body} Z` : `${head} ${body}`;
}

export function samplePolyline(points: Point[], x: number): number {
  if (points.length === 0) return 0;
  if (x <= points[0].x) return points[0].y;
  const last = points[points.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (x >= a.x && x <= b.x) {
      const span = b.x - a.x || 1;
      const t = (x - a.x) / span;
      const s = t * t * (3 - 2 * t);
      return a.y + (b.y - a.y) * s;
    }
  }
  return last.y;
}

export function catmullRom(points: Point[], samplesPerSegment: number): Point[] {
  if (points.length < 2) return points.slice();
  const padded = [points[0], ...points, points[points.length - 1]];
  const sampled: Point[] = [];
  for (let i = 1; i < padded.length - 2; i += 1) {
    for (let step = 0; step < samplesPerSegment; step += 1) {
      sampled.push(crPoint(padded[i - 1], padded[i], padded[i + 1], padded[i + 2], step / samplesPerSegment));
    }
  }
  sampled.push(points[points.length - 1]);
  return sampled;
}

function crPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}
