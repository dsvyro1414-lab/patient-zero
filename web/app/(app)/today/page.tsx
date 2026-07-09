import { getDemo } from "@/lib/api";
import { bandFor, pickToday } from "@/lib/status";
import { Gauge } from "@/components/Gauge";
import { WhyBars } from "@/components/WhyBars";
import { ActionCard } from "@/components/ActionCard";
import { SIGNAL_BY_KEY } from "@/lib/signals";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const demo = await getDemo();
  if (!demo || demo.records.length === 0) return <ServiceDown />;

  const rec = pickToday(demo);
  const status = bandFor(rec);
  const prob = rec.infection_probability ?? 0;
  const hdi = rec.health_deviation_index;

  return (
    <div className="space-y-4">
      <PageHeader n={2} title="TODAY / STATUS" />
      <div className="grid lg:grid-cols-2 gap-4">
        {/* left column */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="text-xs muted tracking-wide mb-2">STATUS</div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold" style={{ color: status.color }}>
                  {status.title === "ILLNESS WATCH" ? "RED" : status.band === "amber" ? "AMBER" : "GREEN"}
                </div>
                <div className="font-medium mt-0.5">{cap(status.title)}</div>
                <div className="muted text-sm">{status.subtitle}</div>
              </div>
              <ShieldBadge color={status.color} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-[color:var(--border)]">
              <div>
                <div className="muted text-xs mb-2">Infection Probability</div>
                <Gauge value={prob} color={status.color} />
              </div>
              <div>
                <div className="muted text-xs mb-2">Health Deviation Index</div>
                <div className="text-3xl font-bold">{hdi.toFixed(2)}</div>
                <HdiMeter value={hdi} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-2">Что это значит</h3>
            <p className="text-sm leading-relaxed">{explain(rec, status.band)}</p>
            <p className="muted text-xs mt-3">
              Сгенерировано AI • Не является медицинской рекомендацией
            </p>
          </div>
        </div>

        {/* right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Почему (топ-сигналы)</h3>
            <WhyBars signals={rec.signals} />
          </div>
          <ActionCard band={status.band} />
        </div>
      </div>

      <SourceNote source={demo.source} modelLoaded={demo.model_loaded} />
    </div>
  );
}

function explain(
  rec: { signals: Record<string, number> },
  band: "green" | "amber" | "red",
): string {
  const top = Object.entries(rec.signals)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 2)
    .map(([k]) => SIGNAL_BY_KEY[k]?.label)
    .filter(Boolean)
    .join(" и ");
  if (band === "red")
    return `Несколько сигналов (${top}) устойчиво отклонились от твоей нормы — картина, которая в исследованиях предшествовала инфекции. Отдых и изоляция сейчас снижают риск.`;
  if (band === "amber")
    return `Твои показатели немного отклонились от нормы (${top}). Есть ранние признаки нагрузки на организм. Отдых и восстановление помогут держать риск под контролем.`;
  return "Показатели держатся в пределах твоего личного baseline. Явных признаков надвигающейся инфекции нет.";
}

function HdiMeter({ value }: { value: number }) {
  const pct = Math.min(1, value / 5);
  const label = value >= 2.5 ? "High" : value >= 1 ? "Moderate" : "Low";
  const color = value >= 2.5 ? "var(--red)" : value >= 1 ? "var(--amber)" : "var(--green)";
  return (
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[11px] muted mt-1">
        <span>0</span>
        <span style={{ color }}>{label}</span>
        <span>5+</span>
      </div>
    </div>
  );
}

function ShieldBadge({ color }: { color: string }) {
  return (
    <div className="grid place-items-center w-11 h-11 rounded-full" style={{ background: `${color}1a` }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" fill={color} opacity="0.9" />
        <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PageHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="text-xs muted tracking-wider">
      {n}. {title}
    </div>
  );
}

function SourceNote({ source, modelLoaded }: { source: string; modelLoaded: boolean }) {
  return (
    <p className="muted text-xs">
      Данные: {source === "synthetic" ? "синтетические (демо)" : source} · модель{" "}
      {modelLoaded ? "загружена" : "не загружена"}
    </p>
  );
}

function ServiceDown() {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">ML-сервис недоступен</h2>
      <p className="muted text-sm">
        Запусти Python-сервис: <code>cd ml-service/src && uvicorn app:app --port 8000</code>,
        затем обнови страницу.
      </p>
    </div>
  );
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
