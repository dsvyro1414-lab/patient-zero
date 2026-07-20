// Plain-language risk-score view for the simple Home + Прогноз screens.
// The ML API owns the score mapping; the frontend only displays the canonical
// 0–100 value and derives its level from that same value.

import type { DemoResult, DayRecord } from "./api";
import { pickToday } from "./status";
import { levelForRecord, scoreForRecord, type RiskLevel } from "./risk-score";

export type { RiskLevel } from "./risk-score";

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

export type DayKey = "today" | "tomorrow" | "d2" | "d3";

export interface DayView {
  key: DayKey;
  score: number;
  level: RiskLevel;
}

export interface WeekPoint {
  rel: number;
  score: number;
}

export interface Forecast {
  today: DayView;
  tomorrow: DayView;
  next: DayView[];         // Завтра, Послезавтра, +2 дня
  series: WeekPoint[];     // last 14 days up to "today"
  trend: "up" | "down" | "flat";
}

const NEXT_KEYS: DayKey[] = ["tomorrow", "d2", "d3"];
const SCORE_TREND_DELTA = 8;
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export function buildForecast(demo: DemoResult): Forecast | null {
  const byDay: Record<number, DayRecord> = Object.fromEntries(
    demo.records.map((r) => [r.day_index, r]),
  );
  const t = pickToday(demo).day_index;

  const view = (idx: number, key: DayKey): DayView | null => {
    const r = byDay[idx];
    if (!r) return null;
    const score = scoreForRecord(r);
    const level = levelForRecord(r);
    if (score == null || level == null) return null;
    return { key, score, level };
  };

  const today = view(t, "today") ?? demo.records
    .map((record) => view(record.day_index, "today"))
    .find((candidate): candidate is DayView => candidate != null);
  if (!today) return null;
  const next = [t + 1, t + 2, t + 3]
    .map((idx, i) => view(idx, NEXT_KEYS[i]))
    .filter(Boolean) as DayView[];

  const series: WeekPoint[] = demo.records
    .filter((r) => r.day_index >= t - 13 && r.day_index <= t)
    .flatMap((r) => {
      const score = scoreForRecord(r);
      return score == null ? [] : [{ rel: r.day_index - t, score }];
    });

  const scores = series.map((s) => s.score);
  const recent = avg(scores.slice(-3));
  const prior = avg(scores.slice(-6, -3));
  const trend = recent > prior + SCORE_TREND_DELTA ? "up" : recent < prior - SCORE_TREND_DELTA ? "down" : "flat";

  return { today, tomorrow: next[0] ?? today, next, series, trend };
}
