import Link from "next/link";
import { getDemo } from "@/lib/api";
import { ActionCard } from "@/components/ActionCard";
import { RiskDay } from "@/components/RiskDay";
import {
  buildForecast, BAND_OF, RISK_COLOR, type RiskLevel,
} from "@/lib/forecast";

export const dynamic = "force-dynamic";

const HEADLINE: Record<RiskLevel, string> = {
  high: "Организм под нагрузкой",
  moderate: "Лёгкая нагрузка на организм",
  low: "Всё спокойно",
};

const EXPLAIN: Record<RiskLevel, string> = {
  high: "Твои показатели заметно отклонились от нормы — так бывает за пару дней до болезни. Сегодня лучше отдохнуть и следить за самочувствием.",
  moderate: "Есть небольшие отклонения от твоей нормы. Ничего страшного, но стоит поберечь себя.",
  low: "Показатели в пределах твоей нормы. Признаков надвигающейся болезни нет.",
};

export default async function HomePage() {
  const demo = await getDemo();
  if (!demo || demo.records.length === 0) return <ServiceDown />;

  const { today, tomorrow } = buildForecast(demo);
  const level = today.level;
  const color = RISK_COLOR[level];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="section-label">Главная</div>

      {/* friendly status */}
      <div className="card p-7">
        <div className="flex items-start gap-5">
          <span
            className="mt-1 grid place-items-center w-14 h-14 rounded-2xl shrink-0"
            style={{ background: `${cssRgba(level, 0.14)}`, border: `1px solid ${cssRgba(level, 0.35)}` }}
          >
            <span className="w-5 h-5 rounded-full" style={{ background: color }} />
          </span>
          <div>
            <div className="section-label mb-1">Сейчас</div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color }}>
              {HEADLINE[level]}
            </h1>
            <p className="muted mt-3 text-[15px] leading-relaxed max-w-xl">
              {EXPLAIN[level]}
            </p>
          </div>
        </div>

        <Link
          href="/forecast"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#0b0d10] hover:bg-white/90 transition-colors"
        >
          Смотреть прогноз →
        </Link>
      </div>

      {/* today / tomorrow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RiskDay view={today} />
        <RiskDay view={tomorrow} />
      </div>

      {/* what to do */}
      <ActionCard band={BAND_OF[level]} />

      <Link href="/report" className="inline-block muted text-sm hover:text-[color:var(--text)] transition-colors">
        Подробная статистика и точность модели →
      </Link>
    </div>
  );
}

function cssRgba(level: RiskLevel, a: number): string {
  const rgb = level === "high" ? "239,70,87" : level === "moderate" ? "245,158,11" : "34,197,94";
  return `rgba(${rgb},${a})`;
}

function ServiceDown() {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">ML-сервис недоступен</h2>
      <p className="muted text-sm">
        Запусти Python-сервис на порту 8000 и обнови страницу.
      </p>
    </div>
  );
}
