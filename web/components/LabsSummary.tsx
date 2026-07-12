"use client";

import { useState } from "react";
import { useLocale, useT } from "./LocaleProvider";
import { fmt } from "@/lib/i18n";
import { fmtZ, SIGNAL_BY_KEY } from "@/lib/signals";
import {
  LAB_DEFS,
  type LabKey,
  type LabEntry,
  type PhysioSummary,
  type LabsSummaryRequest,
  type LabsSummaryResponse,
} from "@/lib/labs";

const RISK_RGB: Record<PhysioSummary["riskLevel"], string> = {
  high: "239,70,87",
  moderate: "245,158,11",
  low: "34,197,94",
};

export function LabsSummary({ physio }: { physio: PhysioSummary | null }) {
  const t = useT();
  const L = t.labs;
  const locale = useLocale();

  const [consented, setConsented] = useState(false);
  const [agree, setAgree] = useState(false);
  const [values, setValues] = useState<Partial<Record<LabKey, string>>>({});
  const [other, setOther] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const setVal = (k: LabKey, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const labs: LabEntry[] = LAB_DEFS.flatMap((def) => {
    const raw = values[def.key];
    if (raw == null || raw.trim() === "") return [];
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > def.max) return [];
    return [{ key: def.key, value: n }];
  });

  const hasInput = labs.length > 0 || other.trim() !== "" || !!physio;

  const errorMsg = (code?: string): string => {
    const map = L.errors as Record<string, string>;
    return (code && map[code]) || L.errors.server_error;
  };

  async function generate() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setCopied(false);
    const reqBody: LabsSummaryRequest = {
      locale,
      labs,
      otherResults: other.trim() || undefined,
      symptomsNote: note.trim() || undefined,
      physio,
    };
    try {
      const r = await fetch("/api/labs-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(errorMsg(j?.error));
        return;
      }
      const j = (await r.json()) as LabsSummaryResponse;
      setSummary(j.summary);
    } catch {
      setError(L.errors.network);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <div className="section-label">{L.label}</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{L.title}</h1>
        <p className="muted mt-2 text-[15px] leading-relaxed max-w-xl">{L.sub}</p>
      </div>

      {!consented ? (
        <ConsentGate
          L={L}
          agree={agree}
          setAgree={setAgree}
          onContinue={() => setConsented(true)}
        />
      ) : (
        <>
          {physio && <PhysioCard L={L} t={t} physio={physio} />}

          {/* Manual lab entry */}
          <div className="card p-5">
            <div className="font-medium mb-1">{L.form.heading}</div>
            <p className="muted text-xs mb-4">{L.form.refLabel}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LAB_DEFS.map((def) => (
                <label
                  key={def.key}
                  className="flex flex-col gap-1.5 rounded-xl px-3.5 py-3 border border-[color:var(--border)]"
                >
                  <span className="text-sm">{L.labNames[def.key]}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={def.max}
                      step={def.step}
                      value={values[def.key] ?? ""}
                      onChange={(e) => setVal(def.key, e.target.value)}
                      placeholder="—"
                      className="w-full bg-transparent rounded-lg px-2.5 py-1.5 border border-[color:var(--border)] text-[color:var(--text)] focus:border-[color:var(--brand)] outline-none"
                    />
                    <span className="text-xs muted whitespace-nowrap w-16 shrink-0">
                      {def.unit}
                    </span>
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--faint)" }}>
                    {fmt(L.form.refPrefix, { range: def.refHint })}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-sm mb-1.5">{L.form.otherLabel}</div>
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                rows={3}
                maxLength={1500}
                placeholder={L.form.otherPlaceholder}
                className="w-full bg-transparent rounded-xl px-3.5 py-2.5 border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:border-[color:var(--brand)] outline-none resize-y"
              />
            </div>

            <div className="mt-4">
              <div className="text-sm mb-1.5">{L.form.noteLabel}</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={800}
                placeholder={L.form.notePlaceholder}
                className="w-full bg-transparent rounded-xl px-3.5 py-2.5 border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:border-[color:var(--brand)] outline-none resize-y"
              />
            </div>
          </div>

          {/* Generate */}
          <div className="flex flex-col gap-2">
            <button
              onClick={generate}
              disabled={loading || !hasInput}
              className="self-start rounded-xl px-5 py-2.5 font-medium text-[#08130b] bg-[color:var(--brand)] hover:brightness-110 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? L.form.generating : L.form.generate}
            </button>
            <p className="muted text-xs">{L.disclaimers.transmission}</p>
          </div>

          {error && (
            <div
              className="rounded-xl p-4 text-sm"
              style={{
                background: "rgba(239,70,87,0.10)",
                border: "1px solid rgba(239,70,87,0.35)",
                color: "var(--text)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {summary && (
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <SparkleIcon />
                  <h2 className="font-semibold">{L.result.title}</h2>
                </div>
                <button
                  onClick={copy}
                  className="text-xs rounded-lg px-3 py-1.5 border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--hover)] transition-colors"
                >
                  {copied ? L.result.copied : L.result.copy}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[color:var(--text)]/95">
                {summary}
              </p>
              <p className="muted text-xs mt-4 pt-4 border-t border-[color:var(--border)]">
                {L.result.aiNote}
              </p>
            </div>
          )}

          {/* Standing disclaimers */}
          <div className="card-2 p-5 space-y-2.5">
            <p className="text-sm text-[color:var(--text)]/85">{L.disclaimers.notDiagnosis}</p>
            <p className="muted text-xs">{L.disclaimers.phi}</p>
            <p className="text-[11px]" style={{ color: "var(--faint)" }}>
              {L.disclaimers.prototype}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

type LabsDict = ReturnType<typeof useT>["labs"];
type FullDict = ReturnType<typeof useT>;

function ConsentGate({
  L,
  agree,
  setAgree,
  onContinue,
}: {
  L: LabsDict;
  agree: boolean;
  setAgree: (v: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldIcon />
        <h2 className="font-semibold">{L.consent.title}</h2>
      </div>
      <p className="text-sm leading-relaxed text-[color:var(--text)]/90">{L.consent.body}</p>
      <ul className="space-y-2">
        {[L.consent.b1, L.consent.b2, L.consent.b3].map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-[color:var(--text)]/80">
            <DotIcon />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[color:var(--brand)]"
        />
        <span className="text-sm text-[color:var(--text)]/90">{L.consent.checkbox}</span>
      </label>
      <button
        onClick={onContinue}
        disabled={!agree}
        className="rounded-xl px-5 py-2.5 font-medium text-[#08130b] bg-[color:var(--brand)] hover:brightness-110 transition disabled:opacity-40 disabled:pointer-events-none"
      >
        {L.consent.agree}
      </button>
    </div>
  );
}

function PhysioCard({
  L,
  t,
  physio,
}: {
  L: LabsDict;
  t: FullDict;
  physio: PhysioSummary;
}) {
  const rgb = RISK_RGB[physio.riskLevel];
  return (
    <div
      className="card p-5"
      style={{ borderColor: `rgba(${rgb},0.4)`, background: `rgba(${rgb},0.05)` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <PulseIcon color={`rgb(${rgb})`} />
        <div className="font-medium">{L.physio.title}</div>
      </div>
      <p className="muted text-xs mb-3">{L.physio.sub}</p>
      <ul className="space-y-1.5 text-sm text-[color:var(--text)]/90">
        <li>
          {fmt(L.physio.riskLine, { level: t.risk.word[physio.riskLevel], pct: physio.riskPct })}
        </li>
        {physio.leadDays != null && (
          <li>{fmt(L.physio.lead, { d: physio.leadDays })}</li>
        )}
        {physio.topSignals.length > 0 && (
          <li>
            {L.physio.signals}{" "}
            {physio.topSignals
              .map((s) => `${SIGNAL_BY_KEY[s.key]?.short ?? s.key} ${fmtZ(s.z)}`)
              .join(" · ")}
          </li>
        )}
      </ul>
      <p className="text-[11px] mt-3" style={{ color: "var(--faint)" }}>
        {L.physio.attachNote}
      </p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 3l7 2.5v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V5.5L12 3Z"
        stroke="var(--brand)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4.2" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulseIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M3 12h3.5l2-5 3 10 2.2-6H21"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <span
      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: "var(--brand)" }}
    />
  );
}
