// Deterministic, rule-based triage for the "Next steps" (Дальше) screen.
// NOT machine learning, NOT a diagnosis, NOT a prescription. It maps the user's
// self-reported symptoms + the wearable risk level to an URGENCY TIER and a
// SPECIALTY/venue (self-monitoring → home care → GP → same-day → emergency).
// It never names a disease-as-cause, a medication, a dose, or an individual doctor.
//
// Safety invariants baked into the logic (audited by the design panel):
//  1. Any red-flag symptom (or a very-high fever) short-circuits to `emergency`
//     FIRST, before any scoring and regardless of the wearable reading.
//  2. The wearable can RAISE urgency but is capped at `gp_soon`: the detector has
//     ~1 false alarm per ~31 days and is not diagnostic, so it can never route to
//     same-day/ER on its own.
//  3. A low/reassuring wearable reading NEVER lowers a symptom-driven tier — the
//     device must not talk a symptomatic user out of care.
//  4. High wearable risk with zero symptoms is the signature pre-symptomatic state:
//     `home_care` with preSymptomatic=true, framed as an early signal, never as
//     "you are getting sick".

import { DURATION_DAYS, RED_FLAG_KEYS } from "./symptoms";

export type RiskLevel = "low" | "moderate" | "high";
export type FeverLevel = "none" | "low" | "moderate" | "high" | "veryHigh";
export type FatigueLevel = "none" | "mild" | "severe";
export type TierId = "monitor" | "home_care" | "gp_soon" | "same_day" | "emergency";

export const TIER_ORDER: TierId[] = ["monitor", "home_care", "gp_soon", "same_day", "emergency"];

export interface Answers {
  fever: FeverLevel;
  fatigue: FatigueLevel;
  /** all toggle symptoms keyed by symptom key (incl. red flags + worsening_24h) */
  toggles: Record<string, boolean>;
  /** index into DURATION_DAYS, or null if the user hasn't answered */
  durationBand: number | null;
}

export interface TriageResult {
  tier: TierId;
  preSymptomatic: boolean;
  /** reason codes (rendered via i18n nextSteps.reasons[code]); most-relevant first */
  reasons: string[];
  /** true if any red-flag symptom / very-high fever is set */
  redFlag: boolean;
}

export const emptyAnswers = (): Answers => ({
  fever: "none",
  fatigue: "none",
  toggles: {},
  durationBand: null,
});

// Symptoms that each add +1 to the score. Fever & fatigue are handled by their
// own severity logic; anosmia and exertional breathlessness are weighted higher
// below; worsening_24h is a trajectory flag (amber floor), not a score point.
const COMMON_SYMPTOM_KEYS = [
  "chills",
  "body_aches",
  "headache",
  "dry_cough",
  "productive_cough",
  "sore_throat",
  "runny_nose",
  "nausea_vomiting",
  "diarrhea",
];

const FEVER_POINTS: Record<FeverLevel, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
  veryHigh: 3, // scoring only; veryHigh is separately treated as a red flag
};

const tierIndex = (t: TierId) => TIER_ORDER.indexOf(t);
const maxTier = (a: TierId, b: TierId): TierId => (tierIndex(a) >= tierIndex(b) ? a : b);

/** Representative day count for the chosen duration band (null band → 0). */
function durationDays(band: number | null): number {
  if (band == null) return 0;
  return DURATION_DAYS[band] ?? 0;
}

export function triage(answers: Answers, risk: RiskLevel): TriageResult {
  const on = (k: string) => answers.toggles[k] === true;
  const days = durationDays(answers.durationBand);

  // --- 1. Red-flag OR-gate: absolute, evaluated first --------------------------
  // Driven by the catalog (RED_FLAG_KEYS) so any red flag added in lib/symptoms.ts
  // automatically escalates here — the catalog stays the single source of truth.
  const anyRedFlag = RED_FLAG_KEYS.some(on) || answers.fever === "veryHigh";

  if (anyRedFlag) {
    const reasons: string[] = [];
    if (answers.fever === "veryHigh") reasons.push("veryHighFever");
    reasons.push("redFlag");
    return { tier: "emergency", preSymptomatic: false, reasons, redFlag: true };
  }

  // --- 2. Symptom score S ------------------------------------------------------
  const feverPts = FEVER_POINTS[answers.fever];
  const commonCount = COMMON_SYMPTOM_KEYS.reduce((n, k) => n + (on(k) ? 1 : 0), 0);
  const fatiguePts = answers.fatigue === "none" ? 0 : 1;
  const anosmia = on("loss_of_smell") || on("loss_of_taste");
  const exertional = on("shortness_of_breath_exertion");
  const longDuration = days > 5;

  const S =
    feverPts +
    commonCount +
    fatiguePts +
    (anosmia ? 2 : 0) +
    (exertional ? 2 : 0) +
    (longDuration ? 1 : 0);

  // number of non-fever symptoms present (for the "high fever + ≥1 other" floor)
  const otherSymptomCount =
    commonCount + fatiguePts + (anosmia ? 1 : 0) + (exertional ? 1 : 0);

  // --- 3. Base tier from S -----------------------------------------------------
  let baseTier: TierId;
  if (S === 0) baseTier = "monitor";
  else if (S <= 3) baseTier = "home_care";
  else baseTier = "gp_soon"; // S >= 4, capped here (symptom count never reaches same-day)

  // --- 4. Wearable nudge (raises only, capped at gp_soon) ----------------------
  const reasons: string[] = [];
  let preSymptomatic = false;
  let nudged: TierId = baseTier;

  if (risk === "high") {
    if (S === 0) {
      nudged = "home_care";
      preSymptomatic = true;
      reasons.push("preSymptomatic", "wearableHigh");
    } else {
      const up = Math.min(tierIndex(baseTier) + 1, tierIndex("gp_soon"));
      nudged = TIER_ORDER[up];
      reasons.push("wearableHigh");
    }
  } else if (risk === "moderate") {
    if (S > 0 && baseTier === "home_care") {
      nudged = "gp_soon"; // physiology corroborates borderline symptoms
      reasons.push("wearableModerate");
    }
    // S === 0 → stays monitor (moderate deviation with no symptoms is common/benign)
  }
  // low risk: never changes the tier (and never lowers it)

  // --- 5. Clinical floors (applied after the nudge; nudge cap can't suppress) ---
  const highFever = answers.fever === "high";
  const highFeverFloor: TierId | null = highFever ? "gp_soon" : null;

  const amber =
    (highFever && otherSymptomCount >= 1) || // high fever + another symptom
    ((answers.fever === "moderate" || answers.fever === "high") && days > 3) || // fever >3 days
    exertional || // breathlessness on exertion
    on("worsening_24h"); // clearly worse in the last 24h
  const amberFloor: TierId | null = amber ? "same_day" : null;

  // --- 6. Resolve final tier ---------------------------------------------------
  let tier: TierId = nudged;
  if (highFeverFloor) tier = maxTier(tier, highFeverFloor);
  if (amberFloor) tier = maxTier(tier, amberFloor);

  // --- 7. Explanatory reasons (transparency; no numeric score shown) -----------
  if (amberFloor) {
    if (highFever && otherSymptomCount >= 1) reasons.unshift("highFeverPlusSymptoms");
    if ((answers.fever === "moderate" || answers.fever === "high") && days > 3) reasons.push("feverDuration");
    if (exertional) reasons.unshift("exertional");
    if (on("worsening_24h")) reasons.push("worsening");
  } else if (highFeverFloor) {
    reasons.unshift("highFever");
  }
  if (anosmia) reasons.push("anosmia");
  if (S >= 4 && !amberFloor) reasons.push("symptomLoad");
  if (longDuration) reasons.push("longDuration");
  if (tier === "monitor" && S === 0 && !preSymptomatic) {
    reasons.push(risk === "moderate" ? "wearableModerate" : "noSymptoms");
  }

  // The pre-symptomatic framing only holds while the tier stays home_care. If a
  // floor raised it (e.g. worsening_24h, which isn't scored, so S can still be 0),
  // drop the flag and its reason so the result never pairs "early signal before
  // symptoms" with same-day urgency.
  if (tier !== "home_care") preSymptomatic = false;

  // de-dupe, keep order, cap for display
  const seen = new Set<string>();
  const uniqueReasons = reasons.filter((r) => {
    if (r === "preSymptomatic" && !preSymptomatic) return false;
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  });

  return { tier, preSymptomatic, reasons: uniqueReasons, redFlag: false };
}
