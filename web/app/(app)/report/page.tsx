import { getEvaluate } from "@/lib/api";
import { RocChart } from "@/components/RocChart";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const data = await getEvaluate();
  if (!data) return <Down />;
  const m = data.metrics;
  const lead = m.median_lead_time_days;
  const sens = m.episode_sensitivity;
  const faPct = Math.round((1 / m.false_alarm_budget_per_days) * 100);

  return (
    <div className="space-y-4">
      <div className="text-xs muted tracking-wider">4. REPORT CARD / METRICS</div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">ROC-кривая модели</h3>
          {data.roc ? (
            <RocChart fpr={data.roc.fpr} tpr={data.roc.tpr} auc={data.roc.auc} />
          ) : (
            <p className="muted text-sm">Нет ROC-данных — запусти обучение.</p>
          )}
          <div className="flex gap-5 text-xs muted mt-2">
            <span className="inline-flex items-center gap-1.5"><i className="w-4 border-t-2" style={{ borderColor: "#16a34a" }} /> Patient Zero (AUC = {m.roc_auc.toFixed(2)})</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--muted)" }} /> Random (0.50)</span>
          </div>
        </div>

        <div className="space-y-4">
          <Stat label="AUC" value={m.roc_auc.toFixed(2)} note="Способность различать" color="#16a34a" />
          <Stat label="Медианное опережение" value={lead == null ? "—" : `${lead} дн.`} note="Раньше первых симптомов" />
          <Stat
            label={`Чувствительность (при FPR ≈ ${faPct}%)`}
            value={sens == null ? "—" : sens.toFixed(2)}
            note={sens == null ? "" : `${Math.round(sens * 100)}% случаев обнаружены`}
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck />
          <div>
            <div className="font-medium">
              Validated on {m.source === "synthetic" ? "synthetic demo data" : "public Stanford dataset"}
            </div>
            <div className="muted text-sm">
              N = {m.subjects.toLocaleString()} subjects · модель: {m.model}
            </div>
          </div>
        </div>
        <p className="muted text-sm max-w-xs">
          Модель не диагностирует заболевания. Используй как дополнительный инструмент.
        </p>
      </div>

      {m.source === "synthetic" && (
        <p className="muted text-xs">
          Сейчас метрики на синтетике (оптимистичны). После обучения на реальных Stanford-данных
          ожидается AUC ≈ 0.75–0.85 — это честная цифра для сабмишна.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, note, color }: { label: string; value: string; note: string; color?: string }) {
  return (
    <div className="card p-5">
      <div className="muted text-sm">{label}</div>
      <div className="text-4xl font-bold mt-1" style={{ color: color ?? "var(--text)" }}>{value}</div>
      {note && <div className="muted text-xs mt-1">{note}</div>}
    </div>
  );
}

function ShieldCheck() {
  return (
    <div className="grid place-items-center w-10 h-10 rounded-full" style={{ background: "#16a34a1a" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" fill="#16a34a" />
        <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Down() {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">Нет метрик</h2>
      <p className="muted text-sm">
        Запусти обучение (<code>python src/train.py</code>) и ML-сервис на порту 8000.
      </p>
    </div>
  );
}
