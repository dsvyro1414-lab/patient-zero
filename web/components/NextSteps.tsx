"use client";

import { useMemo, useState } from "react";
import { useT } from "./LocaleProvider";
import { fmt } from "@/lib/i18n";
import {
  CATEGORY_ORDER,
  FEVER_LEVELS,
  FATIGUE_LEVELS,
  symptomsByCategory,
  type CategoryKey,
  type SymptomDef,
} from "@/lib/symptoms";
import {
  triage,
  emptyAnswers,
  type Answers,
  type RiskLevel,
  type FeverLevel,
  type FatigueLevel,
  type TierId,
} from "@/lib/triage";

// rgb for tier backgrounds (mirrors --green/--amber/--red in globals.css)
const TIER_RGB: Record<TierId, string> = {
  monitor: "34,197,94",
  home_care: "34,197,94",
  gp_soon: "245,158,11",
  same_day: "245,158,11",
  emergency: "239,70,87",
};
const TIER_VAR: Record<TierId, string> = {
  monitor: "var(--green)",
  home_care: "var(--green)",
  gp_soon: "var(--amber)",
  same_day: "var(--amber)",
  emergency: "var(--red)",
};

export function NextSteps({
  risk,
  wearableAvailable,
}: {
  risk: RiskLevel;
  wearableAvailable: boolean;
}) {
  const t = useT();
  const ns = t.nextSteps;

  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const result = useMemo(() => triage(answers, risk), [answers, risk]);

  const selectedCount =
    Object.values(answers.toggles).filter(Boolean).length +
    (answers.fever !== "none" ? 1 : 0) +
    (answers.fatigue !== "none" ? 1 : 0);

  const setToggle = (key: string, on: boolean) =>
    setAnswers((a) => ({ ...a, toggles: { ...a.toggles, [key]: on } }));
  const setFever = (v: FeverLevel) => setAnswers((a) => ({ ...a, fever: v }));
  const setFatigue = (v: FatigueLevel) => setAnswers((a) => ({ ...a, fatigue: v }));
  const clearAll = () => setAnswers(emptyAnswers());

  const rgb = TIER_RGB[result.tier];
  const color = TIER_VAR[result.tier];

  const action =
    result.preSymptomatic && result.tier === "home_care"
      ? ns.preSymptomaticAction
      : ns.tiers[result.tier].action;

  const levelWord = t.risk.word[risk];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="section-label">{ns.label}</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{ns.title}</h1>
        <p className="muted mt-2 text-[15px] leading-relaxed max-w-xl">{ns.sub}</p>
        <p className="muted text-xs mt-2">
          {wearableAvailable ? fmt(ns.wearableLine, { level: levelWord }) : ns.noWearable}
        </p>
      </div>

      {/* Always-visible emergency banner — independent of the computed tier */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "rgba(239,70,87,0.10)", border: "1px solid rgba(239,70,87,0.35)" }}
        role="note"
      >
        <WarningIcon color="var(--red)" />
        <div>
          <div className="font-semibold" style={{ color: "var(--red)" }}>
            {ns.banner.title}
          </div>
          <p className="text-sm mt-1 text-[color:var(--text)]/90">{ns.disclaimers.emergency}</p>
        </div>
      </div>

      {/* Live triage result — sticky so it stays visible while answering */}
      <div className="sticky top-4 z-10">
        <div
          className="card p-6"
          style={{ borderColor: `rgba(${rgb},0.45)`, background: `rgba(${rgb},0.06)` }}
        >
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: color }} />
            <h2 className="text-xl font-bold tracking-tight" style={{ color }}>
              {ns.tiers[result.tier].headline}
            </h2>
          </div>

          <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--text)]/95">{action}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-[color:var(--border)]">
            <div>
              <div className="section-label mb-1.5">{ns.result.whoTitle}</div>
              <p className="text-sm">{ns.tiers[result.tier].specialty}</p>
            </div>
            <div>
              <div className="section-label mb-1.5">{ns.result.whenTitle}</div>
              <p className="text-sm font-medium" style={{ color }}>
                {ns.tiers[result.tier].timeframe}
              </p>
            </div>
          </div>

          {result.reasons.length > 0 && (
            <div className="mt-5">
              <div className="section-label mb-2">{ns.result.whyTitle}</div>
              <div className="flex flex-wrap gap-2">
                {result.reasons.slice(0, 3).map((code) => (
                  <span
                    key={code}
                    className="text-xs rounded-lg px-2.5 py-1 card-2"
                    style={{ color: "var(--text)" }}
                  >
                    {ns.reasons[code as keyof typeof ns.reasons] ?? code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.tier !== "emergency" && (
            <p className="text-sm mt-5 text-[color:var(--text)]/80">{ns.result.safetyNet}</p>
          )}
          <p className="muted text-xs mt-3">{ns.result.disclaimer}</p>
        </div>
      </div>

      {/* Questionnaire controls */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm muted">{fmt(ns.ui.selected, { n: selectedCount })}</span>
        <button
          onClick={clearAll}
          disabled={selectedCount === 0 && answers.durationBand == null}
          className="text-sm rounded-lg px-3 py-1.5 border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--hover)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {ns.ui.clearAll}
        </button>
      </div>
      <p className="muted text-xs -mt-3">{ns.ui.hint}</p>

      {/* Duration */}
      <div className="card p-5">
        <div className="font-medium mb-3">{ns.duration.label}</div>
        <Segmented
          options={ns.duration.options.map((label, i) => ({ key: String(i), label }))}
          value={answers.durationBand == null ? null : String(answers.durationBand)}
          onChange={(k) => setAnswers((a) => ({ ...a, durationBand: k == null ? null : Number(k) }))}
          color="var(--brand)"
        />
      </div>

      {/* Symptom categories */}
      {CATEGORY_ORDER.map((cat) => (
        <CategoryCard
          key={cat}
          cat={cat}
          label={ns.categories[cat]}
          symptoms={symptomsByCategory(cat)}
          answers={answers}
          ns={ns}
          setToggle={setToggle}
          setFever={setFever}
          setFatigue={setFatigue}
        />
      ))}

      {/* Disclaimers */}
      <div className="card-2 p-5 space-y-2.5">
        <p className="text-sm text-[color:var(--text)]/85">{ns.disclaimers.banner}</p>
        <p className="muted text-xs">{ns.higherRisk}</p>
        <p className="muted text-xs">{ns.disclaimers.privacy}</p>
        <p className="text-[11px]" style={{ color: "var(--faint)" }}>{ns.prototype}</p>
      </div>
    </div>
  );
}

type NS = ReturnType<typeof useT>["nextSteps"];

function CategoryCard({
  cat,
  label,
  symptoms,
  answers,
  ns,
  setToggle,
  setFever,
  setFatigue,
}: {
  cat: CategoryKey;
  label: string;
  symptoms: SymptomDef[];
  answers: Answers;
  ns: NS;
  setToggle: (key: string, on: boolean) => void;
  setFever: (v: FeverLevel) => void;
  setFatigue: (v: FatigueLevel) => void;
}) {
  const isRed = cat === "red_flag";
  return (
    <div
      className="card p-5"
      style={isRed ? { borderColor: "rgba(239,70,87,0.4)", background: "rgba(239,70,87,0.04)" } : undefined}
    >
      <div className="flex items-center gap-2 mb-3.5">
        {isRed && <WarningIcon color="var(--red)" size={16} />}
        <h3 className="font-semibold" style={isRed ? { color: "var(--red)" } : undefined}>
          {label}
        </h3>
      </div>

      <div className="space-y-2.5">
        {symptoms.map((s) => {
          if (s.inputType === "severity") {
            if (s.key === "fever") {
              return (
                <SeverityRow
                  key={s.key}
                  label={ns.symptoms.fever}
                  options={FEVER_LEVELS.map((k) => ({ key: k, label: ns.feverLevels[k] }))}
                  value={answers.fever}
                  onChange={(k) => setFever(k as FeverLevel)}
                />
              );
            }
            if (s.key === "fatigue") {
              return (
                <SeverityRow
                  key={s.key}
                  label={ns.symptoms.fatigue}
                  options={FATIGUE_LEVELS.map((k) => ({ key: k, label: ns.fatigueLevels[k] }))}
                  value={answers.fatigue}
                  onChange={(k) => setFatigue(k as FatigueLevel)}
                />
              );
            }
            return null;
          }
          return (
            <ToggleRow
              key={s.key}
              label={ns.symptoms[s.key as keyof typeof ns.symptoms]}
              on={answers.toggles[s.key] === true}
              redFlag={s.redFlag}
              onChange={(on) => setToggle(s.key, on)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  on,
  redFlag,
  onChange,
}: {
  label: string;
  on: boolean;
  redFlag: boolean;
  onChange: (on: boolean) => void;
}) {
  const accent = redFlag ? "239,70,87" : "34,197,94";
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors border"
      style={{
        borderColor: on ? `rgba(${accent},0.55)` : "var(--border)",
        background: on ? `rgba(${accent},0.10)` : "transparent",
      }}
    >
      <span
        className="grid place-items-center w-5 h-5 rounded-md shrink-0 border transition-colors"
        style={{
          borderColor: on ? `rgb(${accent})` : "var(--faint)",
          background: on ? `rgb(${accent})` : "transparent",
        }}
      >
        {on && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="#0b0d10" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`text-sm ${on ? "text-[color:var(--text)]" : "text-[color:var(--text)]/80"}`}>
        {label}
      </span>
    </button>
  );
}

function SeverityRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="rounded-xl px-3.5 py-3 border border-[color:var(--border)]">
      <div className="text-sm mb-2.5">{label}</div>
      <Segmented options={options} value={value} onChange={(k) => onChange(k ?? "none")} color="var(--brand)" />
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
  color,
}: {
  options: { key: string; label: string }[];
  value: string | null;
  onChange: (key: string | null) => void;
  color: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : o.key)}
            className="text-xs rounded-lg px-2.5 py-1.5 border transition-colors"
            style={{
              borderColor: active ? color : "var(--border)",
              background: active ? "rgba(34,197,94,0.14)" : "transparent",
              color: active ? "var(--text)" : "var(--muted)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function WarningIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
      <path
        d="M12 3.5 21 19H3L12 3.5Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="16.6" r="0.5" fill={color} stroke={color} strokeWidth="0.9" />
    </svg>
  );
}
