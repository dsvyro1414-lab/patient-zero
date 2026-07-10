import { getEvaluate } from "@/lib/api";
import { RocChart } from "@/components/RocChart";

export const dynamic = "force-dynamic";

const SIGNAL_RU: Record<string, string> = {
  resting_heart_rate: "пульс покоя",
  hrv_rmssd_milli: "HRV",
  respiratory_rate: "частота дыхания",
  skin_temp_celsius: "темп. кожи",
  sleep_performance: "сон",
  spo2_percentage: "SpO₂",
};

export default async function ReportPage() {
  const data = await getEvaluate();
  if (!data) return <Down />;
  const m = data.metrics;
  const det = m.detection ?? null;
  const real = m.source !== "synthetic";

  // Headline = the detector's PRE-SYMPTOMATIC performance: episodes flagged strictly
  // before the first symptom. The wider [-7,+2] window also counts alarms firing up to
  // two days AFTER onset, which is not what the product promises, so that number is
  // reported as context below rather than as the headline.
  const sens = det ? det.presymptomatic_sensitivity : m.episode_sensitivity;
  const lead = det ? det.median_lead_presymptomatic_days : m.median_lead_time_days;
  const faDays = det?.false_alarm_per_days ?? null;
  const signals = det?.signals_used?.map((s) => SIGNAL_RU[s] ?? s) ?? [];

  return (
    <div className="space-y-4">
      <div className="text-xs muted tracking-wider">4. REPORT CARD / METRICS</div>

      {/* headline: changepoint detection performance */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat
          label="Досимптомная чувствительность"
          value={sens == null ? "—" : `${Math.round(sens * 100)}%`}
          note={det ? `${det.episodes_presymptomatic}/${det.n_episodes} эпизодов пойманы ДО симптомов` : "случаев обнаружено"}
          color="#16a34a"
        />
        <Stat
          label="Медианное опережение"
          value={lead == null ? "—" : `${lead} дн.`}
          note="Среди досимптомных срабатываний"
          color="#3b82f6"
        />
        <Stat
          label="Ложные тревоги"
          value={faDays == null ? "—" : `~1 / ${Math.round(faDays)} дн.`}
          note={det ? `${det.false_alarms} на ${det.scorable_healthy_days} оцениваемых здоровых дней` : "На здоровых днях"}
        />
      </div>

      {det && (
        <p className="muted text-xs leading-relaxed">
          Для полноты: в окне [−{det.detection_window[0]}, +{det.detection_window[1]}] дн.
          вокруг онсета детектор помечает {det.episodes_detected}/{det.n_episodes} эпизодов
          ({Math.round((det.detection_sensitivity ?? 0) * 100)}%) с медианой опережения{" "}
          {det.median_lead_time_days} дн. Это окно засчитывает и тревоги, сработавшие уже
          после первых симптомов, поэтому ведущей цифрой мы держим досимптомную. Дни
          прогрева персонального baseline исключены из знаменателя ложных тревог: в них
          тревога невозможна по построению. Рабочая точка выбрана на этой же когорте.
        </p>
      )}

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* secondary: the trained classifier's ROC */}
        <div className="card p-6">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-semibold">Вторичная модель — ROC</h3>
            <span className="muted text-xs">обученный классификатор, вероятность по дням</span>
          </div>
          {data.roc ? (
            <RocChart fpr={data.roc.fpr} tpr={data.roc.tpr} auc={data.roc.auc} />
          ) : (
            <p className="muted text-sm">Нет ROC-данных — запусти обучение.</p>
          )}
          <div className="flex gap-5 text-xs muted mt-2">
            <span className="inline-flex items-center gap-1.5"><i className="w-4 border-t-2" style={{ borderColor: "#16a34a" }} /> Классификатор (AUC = {m.roc_auc.toFixed(2)})</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--muted)" }} /> Random (0.50)</span>
          </div>
        </div>

        {/* detector description */}
        <div className="card p-6 flex flex-col gap-3">
          <h3 className="font-semibold">Детектор изменений</h3>
          <p className="muted text-sm leading-relaxed">
            Главный слой — персональный changepoint-монитор (robust baseline + CUSUM),
            тот же метод, что в исследованиях Stanford по COVID-19. Ловит устойчивый
            многодневный сдвиг физиологии до симптомов.
          </p>
          <div className="text-sm space-y-1.5 mt-1">
            <Row k="Метод" v={det?.method ?? "changepoint (CUSUM)"} />
            <Row k="Сигналы" v={signals.length ? signals.join(", ") : "—"} />
            <Row k="Окно детекции" v={det ? `[−${det.detection_window[0]}, +${det.detection_window[1]}] дн.` : "—"} />
          </div>
        </div>
      </div>

      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck />
          <div>
            <div className="font-medium">
              {real ? "Проверено на публичном датасете Stanford" : "Проверено на синтетических демо-данных"}
            </div>
            <div className="muted text-sm">
              N = {m.subjects.toLocaleString()} субъектов
              {det ? ` · ${det.n_episodes} эпизодов COVID` : ""} · held-out по субъектам
              {" "}— у классификатора (GroupKFold)
            </div>
          </div>
        </div>
        <p className="muted text-sm max-w-xs">
          Не диагностирует заболевания. Физиологический флаг, не диагноз.
        </p>
      </div>

      {real ? (
        <p className="muted text-xs leading-relaxed">
          Цифры — на публичной когорте Stanford, где доступен только пульс покоя (Fitbit).
          На Whoop каналов пять (HRV, частота дыхания, темп. кожи, сон), но правило их
          слияния на одноканальной когорте проверить нельзя, поэтому мы не заявляем, что
          детекция там будет выше. Многоканальный режим пока не валидирован.
        </p>
      ) : (
        <p className="muted text-xs">
          Сейчас метрики на синтетике (оптимистичны). Подключи реальные Stanford-данные
          (<code>data/build_stanford.py</code>) и переобучи для честных чисел.
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
