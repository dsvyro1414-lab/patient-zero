import { SIGNAL_BY_KEY, fmtZ } from "@/lib/signals";

// A horizontal bar per contributing signal, width ∝ |z|, colored by signal.
export function WhyBars({ signals }: { signals: Record<string, number> }) {
  const rows = Object.entries(signals)
    .map(([key, z]) => ({ key, z, meta: SIGNAL_BY_KEY[key] }))
    .filter((r) => r.meta)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

  const maxAbs = Math.max(1.5, ...rows.map((r) => Math.abs(r.z)));

  return (
    <div className="space-y-3">
      {rows.map(({ key, z, meta }) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-1">
            <span>{meta.label}</span>
            <span className="tabular-nums font-medium" style={{ color: meta.color }}>
              {fmtZ(z)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(Math.abs(z) / maxAbs) * 100}%`, background: meta.color }}
            />
          </div>
        </div>
      ))}
      <p className="muted text-xs pt-1">σ — стандартные отклонения от твоего baseline</p>
    </div>
  );
}
