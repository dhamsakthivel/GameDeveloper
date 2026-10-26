import type { MouthGeometry } from "./geometry";

type SagittalMouthProps = {
  mouth: MouthGeometry;
  soundLabel: string;
};

export function SagittalMouth({ mouth, soundLabel }: SagittalMouthProps) {
  return (
    <svg className="side-svg" viewBox="0 0 460 430" role="img" aria-label="Side cutaway of the mouth and tongue">
      <rect width="460" height="430" fill="#f7f1e4" />
      <path d={mouth.upperHead} fill="#f0c2ae" stroke="#241c18" strokeWidth="2.2" strokeLinejoin="round" />
      <path d={mouth.nasal} fill="#2c2226" />
      <path d={mouth.velum} fill="#e7b8ad" stroke="#241c18" strokeWidth="1.4" strokeLinejoin="round" />
      <path d={mouth.cavity} fill="#24181c" />
      <path d={mouth.tongue} fill="#d25a4a" stroke="#241c18" strokeWidth="1.5" strokeLinejoin="round" />
      {mouth.hook ? (
        <>
          <path d={mouth.hook} fill="none" stroke="#241c18" strokeWidth="20" strokeLinecap="round" />
          <path d={mouth.hook} fill="none" stroke="#d25a4a" strokeWidth="15" strokeLinecap="round" />
        </>
      ) : null}
      <path d={mouth.upperTeeth} fill="#fffaf3" stroke="#241c18" strokeWidth="1.4" />
      <path d={mouth.lowerTeeth} fill="#fffaf3" stroke="#241c18" strokeWidth="1.4" />
      <path d={mouth.upperLip} fill="#a33b45" stroke="#241c18" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={mouth.lowerLip} fill="#a33b45" stroke="#241c18" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M64 126 q10 7 4 16" fill="none" stroke="#241c18" strokeWidth="1.7" strokeLinecap="round" />
      {mouth.contact ? (
        <g>
          <circle cx={mouth.contact.x} cy={mouth.contact.y} r="7" fill="#1c1612" />
          <circle cx={mouth.contact.x} cy={mouth.contact.y} r="3" fill="#f7f1e4" />
        </g>
      ) : null}
      <text x="24" y="26" fill="#5c5148" fontFamily="Outfit, sans-serif" fontSize="13" letterSpacing="1.5">
        FROM THE SIDE
      </text>
      <text x="400" y="26" fill="#1c1612" fontFamily="Fraunces, serif" fontSize="22">
        {soundLabel}
      </text>
    </svg>
  );
}
