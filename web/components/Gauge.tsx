// Display-only semicircular gauge for the backend-owned 0–100 score.
export function Gauge({ value, color }: { value: number; color: string }) {
  const score = value;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circ = Math.PI * r; // half circle length
  const dash = circ * (score / 100);

  return (
    <div className="relative w-[140px] h-[86px]">
      <svg width="140" height="86" viewBox="0 0 140 86">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-2xl font-bold" style={{ color }}>
          {score} / 100
        </span>
      </div>
      <div className="flex justify-between text-[11px] muted px-1 -mt-1">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
