import type { DayRecord, DemoResult } from "./api";

export type Band = "green" | "amber" | "red";

export interface Status {
  band: Band;
  color: string;
  title: string;
  subtitle: string;
}

// Import COLOR from signals (api re-exports nothing) — keep local map.
const BAND_COLOR: Record<Band, string> = {
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ef4444",
};

export function bandFor(rec: DayRecord): Status {
  const p = rec.infection_probability ?? 0;
  if (rec.alarm || p >= 0.6) {
    return {
      band: "red",
      color: BAND_COLOR.red,
      title: "ILLNESS WATCH",
      subtitle: "Ранние признаки инфекции",
    };
  }
  if (p >= 0.3 || rec.health_deviation_index >= 1.0) {
    return {
      band: "amber",
      color: BAND_COLOR.amber,
      title: "WATCH",
      subtitle: "Следи за сигналами",
    };
  }
  return {
    band: "green",
    color: BAND_COLOR.green,
    title: "ALL CLEAR",
    subtitle: "Показатели в норме",
  };
}

/** Pick the day to show as "today" for the demo: the most telling recent day. */
export function pickToday(demo: DemoResult): DayRecord {
  const recs = demo.records;
  if (demo.first_alarm_day != null) {
    const a = recs.find((r) => r.day_index === demo.first_alarm_day);
    if (a) return a;
  }
  // else the day with the highest deviation
  return recs.reduce((best, r) =>
    r.health_deviation_index > best.health_deviation_index ? r : best, recs[0]);
}

export { BAND_COLOR };
