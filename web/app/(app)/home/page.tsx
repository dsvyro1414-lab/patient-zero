import Link from "next/link";
import { getDemo } from "@/lib/api";
import { getT } from "@/lib/locale-server";
import { ActionCard } from "@/components/ActionCard";
import { RiskDay } from "@/components/RiskDay";
import { buildForecast, BAND_OF, RISK_COLOR, type RiskLevel } from "@/lib/forecast";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [demo, t] = await Promise.all([getDemo(), getT()]);
  if (!demo || demo.records.length === 0) return <ServiceDown hint={t.common.serviceDownHint} title={t.common.serviceDown} />;

  const { today, tomorrow } = buildForecast(demo);
  const level = today.level;
  const color = RISK_COLOR[level];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="section-label">{t.home.label}</div>

      {/* friendly status */}
      <div className="card p-7">
        <div className="flex items-start gap-5">
          <span
            className="mt-1 grid place-items-center w-14 h-14 rounded-2xl shrink-0"
            style={{ background: cssRgba(level, 0.14), border: `1px solid ${cssRgba(level, 0.35)}` }}
          >
            <span className="w-5 h-5 rounded-full" style={{ background: color }} />
          </span>
          <div>
            <div className="section-label mb-1">{t.home.now}</div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color }}>
              {t.home.headline[level]}
            </h1>
            <p className="muted mt-3 text-[15px] leading-relaxed max-w-xl">
              {t.home.explain[level]}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/forecast"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#0b0d10] hover:bg-white/90 transition-colors"
          >
            {t.home.cta}
          </Link>
          <Link
            href="/next-steps"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold border transition-colors hover:bg-[color:var(--hover)]"
            style={
              level === "low"
                ? { borderColor: "var(--border)", color: "var(--muted)" }
                : { borderColor: color, color }
            }
          >
            {t.nextSteps.cta}
          </Link>
        </div>
      </div>

      {/* today / tomorrow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RiskDay view={today} t={t.risk} />
        <RiskDay view={tomorrow} t={t.risk} />
      </div>

      {/* what to do */}
      <ActionCard band={BAND_OF[level]} t={t.actions} />

      <Link href="/report" className="inline-block muted text-sm hover:text-[color:var(--text)] transition-colors">
        {t.home.details}
      </Link>
    </div>
  );
}

function cssRgba(level: RiskLevel, a: number): string {
  const rgb = level === "high" ? "239,70,87" : level === "moderate" ? "245,158,11" : "34,197,94";
  return `rgba(${rgb},${a})`;
}

function ServiceDown({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      <p className="muted text-sm">{hint}</p>
    </div>
  );
}
