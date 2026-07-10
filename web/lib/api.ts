// API types + server-side fetch helpers for the Python ML service.

export interface DayRecord {
  day_index: number;
  infection_probability: number | null;
  health_deviation_index: number;
  corroborating_signals: number;
  alarm: boolean;
  signals: Record<string, number>;
  why: { signal: string; z: number }[];
}

export interface DemoResult {
  source: string;
  subject_id: string;
  onset_day: number | null;
  n_days: number;
  n_alarms: number;
  first_alarm_day: number | null;
  model_loaded: boolean;
  records: DayRecord[];
}

export interface Detection {
  method: string;
  signals_used: string[];
  n_episodes: number;
  episodes_detected: number;
  detection_sensitivity: number | null;
  /** episodes whose first in-window alarm fired strictly BEFORE symptom onset */
  episodes_presymptomatic: number;
  presymptomatic_sensitivity: number | null;
  median_lead_presymptomatic_days: number | null;
  median_lead_time_days: number | null;
  mean_lead_time_days: number | null;
  false_alarm_rate_per_day: number;
  false_alarm_per_days: number | null;
  false_alarms: number;
  scorable_healthy_days: number;
  detection_window: [number, number];
}

export interface Metrics {
  source: string;
  model: string;
  subjects: number;
  positives: number;
  roc_auc: number;
  operating_threshold: number;
  episode_sensitivity: number | null;
  median_lead_time_days: number | null;
  healthy_false_alarm_rate: number;
  false_alarm_budget_per_days: number;
  detection?: Detection | null;
}

export interface EvaluateResult {
  metrics: Metrics;
  roc: { fpr: number[]; tpr: number[]; auc: number } | null;
}

const SERVER_BASE = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function getServer<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${SERVER_BASE}${path}`, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const getDemo = () => getServer<DemoResult>("/demo");
export const getEvaluate = () => getServer<EvaluateResult>("/evaluate");
