import { getDemo } from "@/lib/api";
import { getT } from "@/lib/locale-server";
import { bandFor, pickToday } from "@/lib/status";
import { Gauge } from "@/components/Gauge";
import { WhyBars } from "@/components/WhyBars";
import { ActionCard } from "@/components/ActionCard";
import { SIGNAL_BY_KEY } from "@/lib/signals";
import { fmt, type Dict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [demo, t] = await Promise.all([getDemo(), getT()]);
  if (!demo || demo.records.length === 0)
    return <ServiceDown title={t.common.serviceDown} hint={t.common.serviceDownHint} />;

  const rec = pickToday(demo);
  const status = bandFor(rec);
  const band = status.band;
  const prob = rec.infection_probability ?? 0;
  const hdi = rec.health_deviation_index;
  const bandLabel = band === "red" ? "RED" : band === "amber" ? "AMBER" : "GREEN";
  const tt = t.today;

  const top = Object.entries(rec.signals)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 2)
    .map(([k]) => SIGNAL_BY_KEY[k]?.label)
    .filter(Boolean)
    .join(` ${t.common.and} `);

  return (
    <div className="space-y-5">
      <div className="section-label">{tt.label}</div>

      <div className="grid lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-4">
        <div className="space-y-4">
          <div className="card p-6 sm:p-7">
            <div className="section-label mb-3">{tt.status}</div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-bold tracking-tight" style={{ color: status.color }}>
                  {bandLabel}
                </div>
                <div className="text-lg font-semibold mt-1">{tt.title[band]}</div>
                <div className="muted text-sm mt-0.5">{tt.subtitle[band]}</div>
              </div>
              <ShieldBadge color={status.color} />
            </div>

            <div className="grid grid-cols-2 gap-6 mt-7 pt-6 border-t border-[color:var(--border)]">
              <div>
                <div className="muted text-xs mb-3">{tt.infectionProb}</div>
                <Gauge value={prob} color={status.color} />
              </div>
              <div>
                <div className="muted text-xs mb-2">{tt.hdi}</div>
                <div className="text-4xl font-bold tracking-tight">{hdi.toFixed(2)}</div>
                <HdiMeter value={hdi} labels={tt.meter} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-2.5">{tt.meaningTitle}</h3>
            <p className="text-sm leading-relaxed text-[color:var(--text)]/90">
              {fmt(tt.explain[band], { top })}
            </p>
            <p className="muted text-xs mt-4">{tt.aiNote}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">{tt.whyTitle}</h3>
            <WhyBars signals={rec.signals} note={tt.sigmaNote} />
          </div>
          <ActionCard band={band} t={t.actions} />
        </div>
      </div>

      <p className="muted text-xs">
        {fmt(tt.source, {
          source: demo.source === "synthetic" ? tt.synthetic : demo.source,
          model: demo.model_loaded ? tt.sourceModelOn : tt.sourceModelOff,
        })}
      </p>
    </div>
  );
}

function HdiMeter({ value, labels }: { value: number; labels: Dict["today"]["meter"] }) {
  const pct = Math.min(1, value / 5);
  const label = value >= 2.5 ? labels.high : value >= 1 ? labels.moderate : labels.low;
  const color = value >= 2.5 ? "var(--red)" : value >= 1 ? "var(--amber)" : "var(--green)";
  return (
    <div className="mt-3">
      <div className="h-1.5 rounded-full bg-[color:var(--track)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[11px] muted mt-1.5">
        <span>0</span>
        <span style={{ color }}>{label}</span>
        <span>5+</span>
      </div>
    </div>
  );
}

function ShieldBadge({ color }: { color: string }) {
  return (
    <div
      className="grid place-items-center w-11 h-11 rounded-xl"
      style={{ background: `${color}22`, border: `1px solid ${color}40` }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" fill={color} />
        <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ServiceDown({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      <p className="muted text-sm">{hint}</p>
    </div>
  );
}
