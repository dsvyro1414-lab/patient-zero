import { getEvaluate } from "@/lib/api";
import { getT } from "@/lib/locale-server";
import { RocChart } from "@/components/RocChart";
import { fmt } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const [data, t] = await Promise.all([getEvaluate(), getT()]);
  const tr = t.report;
  if (!data) return <Down text={tr.down} />;
  const m = data.metrics;
  const det = m.detection ?? null;
  const real = m.source !== "synthetic";

  const sens = det ? det.presymptomatic_sensitivity : m.episode_sensitivity;
  const lead = det ? det.median_lead_presymptomatic_days : m.median_lead_time_days;
  const faDays = det?.false_alarm_per_days ?? null;
  const signals = det?.signals_used?.map((s) => tr.signalNames[s as keyof typeof tr.signalNames] ?? s) ?? [];

  return (
    <div className="space-y-4">
      <div className="section-label">{tr.label}</div>

      {/* headline: changepoint detection performance */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat
          label={tr.sensLabel}
          value={sens == null ? "—" : `${Math.round(sens * 100)}%`}
          note={det ? fmt(tr.sensNote, { a: det.episodes_presymptomatic, b: det.n_episodes }) : ""}
          color="var(--green)"
        />
        <Stat
          label={tr.leadLabel}
          value={lead == null ? "—" : fmt(tr.leadValue, { d: lead })}
          note={tr.leadNote}
          color="var(--blue)"
        />
        <Stat
          label={tr.faLabel}
          value={faDays == null ? "—" : fmt(tr.faValue, { d: Math.round(faDays) })}
          note={det ? fmt(tr.faNote, { a: det.false_alarms, b: det.scorable_healthy_days }) : ""}
        />
      </div>

      {det && (
        <p className="muted text-xs leading-relaxed">
          {fmt(tr.fullNote, {
            w0: det.detection_window[0],
            w1: det.detection_window[1],
            ep: det.episodes_detected,
            n: det.n_episodes,
            pct: Math.round((det.detection_sensitivity ?? 0) * 100),
            lead: det.median_lead_time_days ?? "—",
          })}
        </p>
      )}

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* secondary: the trained classifier's ROC */}
        <div className="card p-6">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-semibold">{tr.rocTitle}</h3>
            <span className="muted text-xs">{tr.rocSub}</span>
          </div>
          {data.roc ? (
            <RocChart fpr={data.roc.fpr} tpr={data.roc.tpr} auc={data.roc.auc} />
          ) : (
            <p className="muted text-sm">—</p>
          )}
          <div className="flex gap-5 text-xs muted mt-2">
            <span className="inline-flex items-center gap-1.5"><i className="w-4 border-t-2" style={{ borderColor: "var(--green)" }} /> {fmt(tr.rocClassifier, { auc: m.roc_auc.toFixed(2) })}</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--muted)" }} /> {tr.rocRandom}</span>
          </div>
        </div>

        {/* detector description */}
        <div className="card p-6 flex flex-col gap-3">
          <h3 className="font-semibold">{tr.detectorTitle}</h3>
          <p className="muted text-sm leading-relaxed">{tr.detectorText}</p>
          <div className="text-sm space-y-1.5 mt-1">
            <Row k={tr.method} v={det?.method ?? "changepoint (CUSUM)"} />
            <Row k={tr.signals} v={signals.length ? signals.join(", ") : "—"} />
            <Row k={tr.window} v={det ? fmt(tr.windowVal, { w0: det.detection_window[0], w1: det.detection_window[1] }) : "—"} />
          </div>
        </div>
      </div>

      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck />
          <div>
            <div className="font-medium">{real ? tr.validatedReal : tr.validatedSynthetic}</div>
            <div className="muted text-sm">
              {fmt(tr.validatedSub, {
                n: m.subjects.toLocaleString(),
                ep: det ? fmt(tr.episodesCovid, { n: det.n_episodes }) : "",
              })}
            </div>
          </div>
        </div>
        <p className="muted text-sm max-w-xs">{tr.notDiagnosis}</p>
      </div>

      {real && <p className="muted text-xs leading-relaxed">{tr.footnoteReal}</p>}
    </div>
  );
}

function Stat({ label, value, note, color }: { label: string; value: string; note: string; color?: string }) {
  return (
    <div className="card p-6">
      <div className="muted text-sm">{label}</div>
      <div className="text-[2.6rem] leading-none font-bold mt-2.5 tracking-tight" style={{ color: color ?? "var(--text)" }}>{value}</div>
      {note && <div className="muted text-xs mt-3">{note}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="muted">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

function ShieldCheck() {
  return (
    <div className="grid place-items-center w-10 h-10 rounded-full" style={{ background: "rgba(34,197,94,0.14)" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" fill="var(--green)" />
        <path d="m9 12 2 2 4-4" stroke="#08090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Down({ text }: { text: string }) {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">—</h2>
      <p className="muted text-sm">{text}</p>
    </div>
  );
}
