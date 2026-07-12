// Symptom catalog for the "Next steps" (Дальше) triage screen.
// UI-only structure: keys, category, and input type. Human labels are looked up
// via i18n (nextSteps.symptoms[key] / .categories[categoryKey] / .feverLevels /
// .fatigueLevels), so the catalog stays language-agnostic. The scoring logic that
// consumes these keys lives in lib/triage.ts — kept separate so the medical rule
// is auditable in one place.

export type CategoryKey =
  | "general"
  | "respiratory"
  | "ent"
  | "chemosensory"
  | "gi"
  | "red_flag";

// Render order; red_flag is deliberately last and visually distinct.
export const CATEGORY_ORDER: CategoryKey[] = [
  "general",
  "respiratory",
  "ent",
  "chemosensory",
  "gi",
  "red_flag",
];

export type InputType = "toggle" | "severity";

export interface SymptomDef {
  key: string;
  categoryKey: CategoryKey;
  inputType: InputType;
  redFlag: boolean;
}

export const FEVER_LEVELS = ["none", "low", "moderate", "high", "veryHigh"] as const;
export const FATIGUE_LEVELS = ["none", "mild", "severe"] as const;

// Days-unwell duration bands (labels in i18n nextSteps.duration.options).
// The representative day count is what the rule engine reasons about.
export const DURATION_DAYS = [0, 2, 4, 7, 10];

export const SYMPTOMS: SymptomDef[] = [
  // General / systemic
  { key: "fever", categoryKey: "general", inputType: "severity", redFlag: false },
  { key: "chills", categoryKey: "general", inputType: "toggle", redFlag: false },
  { key: "fatigue", categoryKey: "general", inputType: "severity", redFlag: false },
  { key: "body_aches", categoryKey: "general", inputType: "toggle", redFlag: false },
  { key: "headache", categoryKey: "general", inputType: "toggle", redFlag: false },
  { key: "worsening_24h", categoryKey: "general", inputType: "toggle", redFlag: false },
  // Breathing & chest
  { key: "dry_cough", categoryKey: "respiratory", inputType: "toggle", redFlag: false },
  { key: "productive_cough", categoryKey: "respiratory", inputType: "toggle", redFlag: false },
  { key: "shortness_of_breath_exertion", categoryKey: "respiratory", inputType: "toggle", redFlag: false },
  // Nose & throat
  { key: "sore_throat", categoryKey: "ent", inputType: "toggle", redFlag: false },
  { key: "runny_nose", categoryKey: "ent", inputType: "toggle", redFlag: false },
  // Smell & taste
  { key: "loss_of_smell", categoryKey: "chemosensory", inputType: "toggle", redFlag: false },
  { key: "loss_of_taste", categoryKey: "chemosensory", inputType: "toggle", redFlag: false },
  // Stomach & gut
  { key: "nausea_vomiting", categoryKey: "gi", inputType: "toggle", redFlag: false },
  { key: "diarrhea", categoryKey: "gi", inputType: "toggle", redFlag: false },
  // Red flags — urgent (rendered last, always-visible banner mirrors these)
  { key: "severe_breathing_difficulty", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "chest_pain_pressure", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "confusion_drowsy", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "bluish_lips_face", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "fainting", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "coughing_blood", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "cannot_keep_fluids", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
  { key: "stroke_signs", categoryKey: "red_flag", inputType: "toggle", redFlag: true },
];

export const RED_FLAG_KEYS = SYMPTOMS.filter((s) => s.redFlag).map((s) => s.key);

export function symptomsByCategory(cat: CategoryKey): SymptomDef[] {
  return SYMPTOMS.filter((s) => s.categoryKey === cat);
}
