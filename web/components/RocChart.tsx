"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

export function RocChart({ fpr, tpr, auc }: { fpr: number[]; tpr: number[]; auc: number }) {
  const data = fpr.map((x, i) => ({ fpr: x, tpr: tpr[i], diag: x }));
  return (
    <div className="relative h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 18 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            dataKey="fpr" type="number" domain={[0, 1]} tickCount={5}
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            label={{ value: "False Positive Rate (1 - Specificity)", position: "insideBottom", offset: -8, fontSize: 11, fill: "var(--muted)" }}
          />
          <YAxis
            type="number" domain={[0, 1]} tickCount={5}
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            label={{ value: "True Positive Rate (Sensitivity)", angle: -90, position: "insideLeft", offset: 16, fontSize: 11, fill: "var(--muted)" }}
          />
          <Tooltip
            formatter={(v: number, n: string) => [v.toFixed(3), n === "tpr" ? "TPR" : "random"]}
            labelFormatter={(l: number) => `FPR ${Number(l).toFixed(2)}`}
          />
          <Line dataKey="diag" stroke="var(--muted)" strokeDasharray="5 5" dot={false} strokeWidth={1.2} isAnimationActive={false} />
          <Line dataKey="tpr" stroke="#22c55e" dot={false} strokeWidth={2.6} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="absolute right-10 bottom-16 text-right pointer-events-none">
        <div className="muted text-sm">AUC</div>
        <div className="text-4xl font-bold" style={{ color: "var(--green)" }}>{auc.toFixed(2)}</div>
      </div>
    </div>
  );
}
