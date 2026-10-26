import { clamp, lerp } from "./math";

type FrontLipsProps = {
  lipRound: number;
  lipAperture: number;
  tongueTip: number;
};

export function FrontLips({ lipRound, lipAperture, tongueTip }: FrontLipsProps) {
  const cx = 110;
  const cy = 104;
  const halfW = lerp(78, 36, lipRound);
  const opening = clamp(lipAperture * 0.62, 1.4, 52);
  const thickness = lerp(16, 26, lipRound);
  const outerRx = halfW + thickness * 0.35;
  const outerRy = opening + thickness;
  const teethH = opening > 7 ? Math.min(16, opening * 0.42) : 0;
  const showTongue = opening > 12 && tongueTip < 0.45;

  return (
    <svg className="front-svg" viewBox="0 0 220 190" role="img" aria-label="Front view of the lips">
      <ellipse cx="110" cy="96" rx="96" ry="82" fill="#f0c2ae" />
      <path
        d="M110 58 C118 70 124 78 110 84 C96 78 102 70 110 58"
        fill="#e7b09c"
        stroke="#2a221c"
        strokeWidth="1.4"
      />
      <ellipse cx={cx} cy={cy + 2} rx={outerRx} ry={outerRy} fill="#a33b45" />
      <ellipse cx={cx} cy={cy + 4} rx={halfW} ry={Math.max(opening, 1.2)} fill="#24181c" />
      {teethH > 0 ? (
        <rect
          x={cx - halfW * 0.72}
          y={cy + 4 - opening}
          width={halfW * 1.44}
          height={teethH}
          rx="2"
          fill="#fffaf3"
        />
      ) : null}
      {showTongue ? (
        <ellipse cx={cx} cy={cy + 4 + opening * 0.45} rx={halfW * 0.55} ry={opening * 0.28} fill="#c4483a" />
      ) : null}
      <path
        d={`M ${cx - halfW} ${cy + 4} Q ${cx} ${cy + 4 - opening * 0.15} ${cx + halfW} ${cy + 4}`}
        fill="none"
        stroke="#6e242c"
        strokeWidth="1"
        opacity="0.45"
      />
    </svg>
  );
}
