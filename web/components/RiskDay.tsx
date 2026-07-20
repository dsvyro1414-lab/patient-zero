import { RISK_COLOR, type DayView } from "@/lib/forecast";
import type { Dict } from "@/lib/i18n";

// One day's risk, in plain words + a simple meter. Used on Home and Прогноз.
export function RiskDay({ view, t }: { view: DayView; t: Dict["risk"] }) {
  const color = RISK_COLOR[view.level];
  return (
    <div className="card p-5">
      <div className="section-label mb-2">{t.days[view.key]}</div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold tracking-tight whitespace-nowrap" style={{ color }}>
          {t.word[view.level]}
        </div>
        <div className="text-xl font-bold tabular-nums" style={{ color }}>
          {view.score} / 100
        </div>
      </div>
      <div className="mt-1 text-xs muted">{t.sub}</div>
      <div className="mt-3 h-2 rounded-full bg-[color:var(--track)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${view.score}%`, background: color }} />
      </div>
    </div>
  );
}
