"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from "recharts";
import type { WeekPoint } from "@/lib/forecast";
import { fmt } from "@/lib/i18n";
import { useT } from "./LocaleProvider";

// A deliberately plain score over the last 2 weeks — no σ, no numeric axis.
export function WeekTrend({ series }: { series: WeekPoint[] }) {
  const t = useT().risk;
  return (
    <div className="h-[200px] mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="risk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ef4657" stopOpacity={0.55} />
              <stop offset="0.55" stopColor="#f59e0b" stopOpacity={0.22} />
              <stop offset="1" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 100]} hide />
          <XAxis
            dataKey="rel"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            tickFormatter={(v: number) => (v === 0 ? t.chartToday : fmt(t.chartDays, { n: -v }))}
            ticks={[series[0]?.rel ?? -13, -7, 0]}
          />
          <Tooltip content={<TrendTip t={t} />} />
          <Area
            type="monotone" dataKey="score" stroke="#f5a524" strokeWidth={2.4}
            fill="url(#risk)" isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendTip({ active, payload, t }: any) {
  if (!active || !payload?.length) return null;
  const rel = payload[0].payload.rel as number;
  const score = Math.round(payload[0].value as number);
  return (
    <div className="card p-2.5 text-xs">
      <div className="muted mb-0.5">{rel === 0 ? t.tipToday : fmt(t.tipDaysAgo, { n: -rel })}</div>
      <div className="font-medium">{fmt(t.tipLevel, { n: score })}</div>
    </div>
  );
}
