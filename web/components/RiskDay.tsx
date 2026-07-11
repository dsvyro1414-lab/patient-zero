import { RISK_COLOR, RISK_WORD, type DayView } from "@/lib/forecast";

// One day's risk, in plain words + a simple meter. Used on Home and Прогноз.
export function RiskDay({ view }: { view: DayView }) {
  const color = RISK_COLOR[view.level];
  return (
    <div className="card p-5">
      <div className="section-label mb-2">{view.label}</div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold tracking-tight whitespace-nowrap" style={{ color }}>
          {RISK_WORD[view.level]}
        </div>
        <div className="text-xl font-bold tabular-nums" style={{ color }}>
          {view.pct}%
        </div>
      </div>
      <div className="mt-1 text-xs muted">риск заболеть</div>
      <div className="mt-3 h-2 rounded-full bg-[color:var(--track)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${view.pct}%`, background: color }} />
      </div>
    </div>
  );
}
