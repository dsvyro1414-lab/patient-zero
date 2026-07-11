"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts";
import type { WeekPoint } from "@/lib/forecast";

// A deliberately plain "risk over the last 2 weeks" area — no σ, no numeric axis.
export function WeekTrend({ series }: { series: WeekPoint[] }) {
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
            tickFormatter={(v: number) => (v === 0 ? "сегодня" : `${-v} дн`)}
            ticks={[series[0]?.rel ?? -13, -7, 0]}
          />
          <ReferenceLine y={65} stroke="var(--red)" strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: "высокий", fill: "var(--muted)", fontSize: 10, position: "insideTopLeft" }} />
          <Tooltip content={<TrendTip />} />
          <Area
            type="monotone" dataKey="pct" stroke="#f5a524" strokeWidth={2.4}
            fill="url(#risk)" isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const rel = payload[0].payload.rel as number;
  const pct = Math.round(payload[0].value as number);
  return (
    <div className="card p-2.5 text-xs">
      <div className="muted mb-0.5">{rel === 0 ? "сегодня" : `${-rel} дн. назад`}</div>
      <div className="font-medium">Уровень риска {pct}%</div>
    </div>
  );
}
