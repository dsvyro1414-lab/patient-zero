// Plain-language risk view for the simple Home + Прогноз screens.
// The end-user product speaks in "risk level", not σ / HDI / AUC. We derive a
// single risk level from the detector's Health Deviation Index (the real signal,
// which tracks the status), NOT from the weak single-channel classifier
// probability (1–10% even on alarm days), which would read as a misleading "10%".

import type { DemoResult, DayRecord } from "./api";
import { pickToday } from "./status";

export type RiskLevel = "low" | "moderate" | "high";

// HDI ≈ 3.5 maps to ~100%. Alarm-day HDI (~2.6) → ~75%, quiet days → low.
export function riskPct(hdi: number): number {
  return Math.max(0, Math.min(100, Math.round((hdi / 3.5) * 100)));
}

// Self-consistent band so the word and the % never contradict each other.
export function levelFromPct(pct: number): RiskLevel {
  if (pct >= 65) return "high";
  if (pct >= 30) return "moderate";
  return "low";
}

export const RISK_WORD: Record<RiskLevel, string> = {
  high: "Высокий",
  moderate: "Средний",
  low: "Низкий",
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  high: "var(--red)",
  moderate: "var(--amber)",
  low: "var(--green)",
};

// bridge to the existing green/amber/red action + status vocabulary
export const BAND_OF: Record<RiskLevel, "red" | "amber" | "green"> = {
  high: "red",
  moderate: "amber",
  low: "green",
};

export interface DayView {
  label: string;
  pct: number;
  level: RiskLevel;
}

export interface WeekPoint {
  rel: number;
  load: number; // Health Deviation Index, shown as "нагрузка на организм"
  pct: number;
}

export interface Forecast {
  today: DayView;
  tomorrow: DayView;
  next: DayView[];         // Завтра, Послезавтра, +2 дня
  series: WeekPoint[];     // last 14 days up to "today"
  trend: "up" | "down" | "flat";
}

const LABELS = ["Завтра", "Послезавтра", "Через 2 дня"];
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export function buildForecast(demo: DemoResult): Forecast {
  const byDay: Record<number, DayRecord> = Object.fromEntries(
    demo.records.map((r) => [r.day_index, r]),
  );
  const t = pickToday(demo).day_index;

  const view = (idx: number, label: string): DayView | null => {
    const r = byDay[idx];
    if (!r) return null;
    const pct = riskPct(r.health_deviation_index);
    return { label, pct, level: levelFromPct(pct) };
  };

  const today = view(t, "Сегодня")!;
  const next = [t + 1, t + 2, t + 3]
    .map((idx, i) => view(idx, LABELS[i]))
    .filter(Boolean) as DayView[];

  const series: WeekPoint[] = demo.records
    .filter((r) => r.day_index >= t - 13 && r.day_index <= t)
    .map((r) => ({
      rel: r.day_index - t,
      load: r.health_deviation_index,
      pct: riskPct(r.health_deviation_index),
    }));

  const loads = series.map((s) => s.load);
  const recent = avg(loads.slice(-3));
  const prior = avg(loads.slice(-6, -3));
  const trend = recent > prior + 0.3 ? "up" : recent < prior - 0.3 ? "down" : "flat";

  return { today, tomorrow: next[0] ?? today, next, series, trend };
}

export const TREND_TEXT: Record<Forecast["trend"], string> = {
  up: "Риск в последние дни растёт",
  down: "Риск в последние дни снижается",
  flat: "Риск держится примерно на одном уровне",
};
