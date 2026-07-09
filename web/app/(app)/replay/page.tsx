"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ReferenceArea, Tooltip,
} from "recharts";
import type { DemoResult, DayRecord } from "@/lib/api";
import { SIGNALS, SIGNAL_BY_KEY, COLOR, fmtZ } from "@/lib/signals";

export default function ReplayPage() {
  const [demo, setDemo] = useState<DemoResult | null>(null);
  const [err, setErr] = useState(false);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    fetch("/ml/demo")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DemoResult) => {
        setDemo(d);
        setSel(d.first_alarm_day ?? d.records[Math.floor(d.records.length / 2)]?.day_index ?? 0);
      })
      .catch(() => setErr(true));
  }, []);

  const WIN_PRE = 21;
  const WIN_POST = 14;

  const prepared = useMemo(() => {
    if (!demo) return null;
    const onset = demo.onset_day ?? 0;
    const rows = demo.records
      .filter((r) => r.day_index - onset >= -WIN_PRE && r.day_index - onset <= WIN_POST)
      .map((r) => {
        const row: Record<string, number | null> = {
          rel: r.day_index - onset,
          day: r.day_index,
          hdi: r.health_deviation_index,
          prob: r.infection_probability == null ? null : r.infection_probability * 100,
        };
        for (const s of SIGNALS) row[s.key] = r.signals[s.key] ?? null;
        return row;
      });
    return {
      rows,
      onset,
      dayMin: rows.length ? (rows[0].day as number) : 0,
      dayMax: rows.length ? (rows[rows.length - 1].day as number) : 0,
      alarmRel: demo.first_alarm_day == null ? null : demo.first_alarm_day - onset,
      byDay: Object.fromEntries(demo.records.map((r) => [r.day_index, r])) as Record<number, DayRecord>,
    };
  }, [demo]);

  if (err) return <Down />;
  if (!demo || !prepared || sel == null) return <div className="p-6 muted">Загрузка…</div>;

  const clSel = Math.min(prepared.dayMax, Math.max(prepared.dayMin, sel));
  const selRel = clSel - prepared.onset;
  const selRec = prepared.byDay[clSel];

  return (
    <div className="space-y-4">
      <div className="text-xs muted tracking-wider">3. REPLAY TIMELINE</div>

      <div className="card p-5">
        <Legend />

        {/* signals in shared σ-space */}
        <div className="h-[240px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prepared.rows} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <ReferenceArea y1={-1} y2={1} fill="#94a3b8" fillOpacity={0.06} />
              <XAxis dataKey="rel" tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} />
              <YAxis domain={[-3, 4]} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false}
                axisLine={false} label={{ value: "σ", position: "insideTopLeft", fontSize: 11, fill: "var(--muted)" }} />
              <Tooltip content={<SigTip />} />
              <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="4 4" />
              {prepared.alarmRel != null && (
                <ReferenceLine x={prepared.alarmRel} stroke={COLOR.amber} strokeWidth={1.5}
                  label={{ value: "ALARM", fill: COLOR.amber, fontSize: 10, position: "top" }} />
              )}
              <ReferenceLine x={0} stroke={COLOR.red} strokeDasharray="5 4"
                label={{ value: "ONSET", fill: COLOR.red, fontSize: 10, position: "top" }} />
              <ReferenceLine x={selRel} stroke="var(--text)" strokeOpacity={0.35} />
              {SIGNALS.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color}
                  dot={false} strokeWidth={1.8} connectNulls isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* HDI + infection probability */}
        <div className="h-[150px] mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prepared.rows} margin={{ top: 6, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="rel" tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false}
                label={{ value: "Days relative to onset", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--muted)" }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} unit="%"
                tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<HdiTip />} />
              {prepared.alarmRel != null && <ReferenceLine yAxisId="l" x={prepared.alarmRel} stroke={COLOR.amber} strokeWidth={1.5} />}
              <ReferenceLine yAxisId="l" x={0} stroke={COLOR.red} strokeDasharray="5 4" />
              <ReferenceLine yAxisId="l" x={selRel} stroke="var(--text)" strokeOpacity={0.35} />
              <Line yAxisId="l" type="monotone" dataKey="hdi" stroke={COLOR.hdi} dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line yAxisId="r" type="monotone" dataKey="prob" stroke={COLOR.prob} dot={false} strokeWidth={2} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Scrubber min={prepared.dayMin} max={prepared.dayMax} sel={clSel} setSel={setSel} selRel={selRel} rec={selRec} />
        <Contributions rec={selRec} />
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    ...SIGNALS.map((s) => ({ label: s.label, color: s.color, dash: false })),
    { label: "Baseline", color: "var(--muted)", dash: true },
    { label: "Health Deviation Index", color: COLOR.hdi, dash: false },
    { label: "Infection Probability", color: COLOR.prob, dash: false },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0 border-t-2" style={{ borderColor: i.color, borderStyle: i.dash ? "dashed" : "solid" }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Scrubber({
  min, max, sel, setSel, selRel, rec,
}: { min: number; max: number; sel: number; setSel: (n: number) => void; selRel: number; rec: DayRecord }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div>
          <div className="muted text-xs">День</div>
          <div className="text-2xl font-bold tabular-nums">{selRel >= 0 ? `+${selRel}` : selRel}</div>
        </div>
        <input
          type="range" min={min} max={max} value={sel}
          onChange={(e) => setSel(Number(e.target.value))}
          className="flex-1 accent-[color:var(--brand)]"
        />
        <button
          onClick={() => setSel(Math.min(max, sel + 1))}
          className="grid place-items-center w-9 h-9 rounded-lg border border-[color:var(--border)] hover:bg-black/[0.04]"
          aria-label="next day"
        >→</button>
      </div>
      <p className="muted text-xs mt-3">
        {rec.alarm ? "🔴 Тревога активна в этот день" : `Health Deviation Index: ${rec.health_deviation_index.toFixed(2)}`}
        {rec.infection_probability != null && ` · вероятность ${Math.round(rec.infection_probability * 100)}%`}
      </p>
    </div>
  );
}

function Contributions({ rec }: { rec: DayRecord }) {
  const dir = (k: string, z: number) => (SIGNAL_BY_KEY[k]?.direction === "drop" ? -z : z);
  const rows = Object.entries(rec.signals)
    .map(([k, z]) => ({ k, z, meta: SIGNAL_BY_KEY[k], c: Math.max(0, dir(k, z)) }))
    .filter((r) => r.meta);
  const total = rows.reduce((s, r) => s + r.c, 0) || 1;

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">Вклады сигналов <span className="muted font-normal text-sm">(в этот день)</span></h3>
      <div className="space-y-2.5">
        {rows.sort((a, b) => b.c - a.c).map(({ k, z, meta, c }) => (
          <div key={k} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0">{meta!.short}</span>
            <span className="w-14 tabular-nums" style={{ color: meta!.color }}>{fmtZ(z)}</span>
            <span className="flex-1 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${(c / total) * 100}%`, background: meta!.color }} />
            </span>
            <span className="w-9 text-right tabular-nums muted">{Math.round((c / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SigTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-2.5 text-xs">
      <div className="muted mb-1">день {Number(label) >= 0 ? `+${label}` : label}</div>
      {payload.filter((p: any) => p.value != null).map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{SIGNAL_BY_KEY[p.dataKey]?.short}</span>
          <span className="tabular-nums">{fmtZ(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function HdiTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-2.5 text-xs space-y-0.5">
      <div className="muted">день {Number(label) >= 0 ? `+${label}` : label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.dataKey === "hdi" ? "HDI" : "Probability"}</span>
          <span className="tabular-nums">{p.dataKey === "prob" ? `${Math.round(p.value)}%` : p.value?.toFixed?.(2)}</span>
        </div>
      ))}
    </div>
  );
}

function Down() {
  return (
    <div className="card p-8 max-w-lg">
      <h2 className="font-semibold text-lg mb-2">ML-сервис недоступен</h2>
      <p className="muted text-sm">Запусти <code>uvicorn app:app --port 8000</code> в ml-service/src.</p>
    </div>
  );
}
