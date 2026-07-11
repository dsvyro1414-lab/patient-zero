import { getDemo } from "@/lib/api";
import { ActionCard } from "@/components/ActionCard";
import { RiskDay } from "@/components/RiskDay";
import { WeekTrend } from "@/components/WeekTrend";
import {
  buildForecast, BAND_OF, RISK_COLOR, RISK_WORD, TREND_TEXT, type Forecast,
} from "@/lib/forecast";

export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const demo = await getDemo();
  if (!demo || demo.records.length === 0) return <ServiceDown />;

  const f = buildForecast(demo);
  const level = f.today.level;
  const color = RISK_COLOR[level];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="section-label">Прогноз</div>

      {/* headline risk for today */}
      <div className="card p-7">
        <div className="section-label mb-3">Оценка риска заболеть · сегодня</div>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div className="text-[4rem] leading-none font-bold tabular-nums tracking-tight" style={{ color }}>
            {f.today.pct}%
          </div>
          <div className="pb-2">
            <div className="text-2xl font-bold tracking-tight" style={{ color }}>
              {RISK_WORD[level]} риск
            </div>
            <div className="muted text-sm mt-0.5">ранний сигнал по твоим показателям</div>
          </div>
        </div>
        <div className="mt-6 h-2.5 rounded-full bg-[color:var(--track)] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${f.today.pct}%`, background: color }} />
        </div>
        <p className="muted text-xs mt-4 leading-relaxed max-w-xl">
          Это не диагноз. Мы замечаем отклонения в организме раньше первых симптомов —
          но точный диагноз может поставить только врач.
        </p>
      </div>

      {/* next days */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendArrow dir={f.trend} />
          <span className="font-medium">{TREND_TEXT[f.trend]}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RiskDay view={f.today} />
          {f.next.map((v) => (
            <RiskDay key={v.label} view={v} />
          ))}
        </div>
      </div>

      {/* two-week trend */}
      <div className="card p-6">
        <h3 className="font-semibold">Уровень риска за 2 недели</h3>
        <p className="muted text-sm mb-1">
          Чем выше линия — тем сильнее организм отклонялся от твоей нормы.
        </p>
        <WeekTrend series={f.series} />
      </div>

      {/* what to do */}
      <ActionCard band={BAND_OF[level]} />
    </div>
  );
}

function TrendArrow({ dir }: { dir: Forecast["trend"] }) {
  const color = dir === "up" ? "var(--red)" : dir === "down" ? "var(--green)" : "var(--muted)";
  const d = dir === "up" ? "M5 15l7-7 7 7" : dir === "down" ? "M5 9l7 7 7-7" : "M5 12h14";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color }}>
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServiceDown() {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">ML-сервис недоступен</h2>
      <p className="muted text-sm">Запусти Python-сервис на порту 8000 и обнови страницу.</p>
    </div>
  );
}
