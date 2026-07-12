// POST /api/labs-summary — turns manually-entered lab values + a wearable
// physiological timeline into a plain-language "summary to bring to your doctor".
//
// Safety (HANDOFF §12): this is INFORMATION TO DISCUSS WITH A DOCTOR — never a
// diagnosis, never a prescription, no drug names, no named clinicians. The
// guardrails live in the system prompt below. This handler does NOT persist the
// payload (labs are PHI) and never logs the values.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  LAB_BY_KEY,
  LAB_LABEL_EN,
  SIGNAL_EN,
  MAX_OTHER_CHARS,
  MAX_NOTE_CHARS,
  type LabsSummaryRequest,
  type LabsSummaryResponse,
  type LabEntry,
  type PhysioSummary,
} from "@/lib/labs";

export const runtime = "nodejs"; // the SDK needs Node APIs, not the edge runtime
export const dynamic = "force-dynamic";
export const maxDuration = 60; // give the model room; well under this in practice

// Opus 4.8: most capable Opus-tier model and ZDR-compatible — the right call for
// PHI, where we specifically do NOT want data retention. (Fable 5 would be more
// capable but mandates 30-day retention, which is wrong for lab values.)
const MODEL = "claude-opus-4-8";

const SYSTEM = `You are a careful medical-communication assistant inside a consumer wellness prototype called Patient Zero. A user has entered their own lab-test values and, optionally, a summary of what their wearable device detected. Your job is to write a short, plain-language "summary to bring to your doctor" that helps them have a productive conversation at their appointment.

HARD RULES — never break these:
- This is NOT a diagnosis, NOT a triage decision, and NOT a treatment plan. You are organizing information for a clinician to interpret.
- Do NOT state or imply what disease the person has or might have. Do NOT list or rank possible diagnoses.
- Do NOT name or recommend any specific medication, dose, supplement, or treatment.
- Do NOT name specific doctors, clinics, hospitals, or brands. You may refer to a TYPE of clinician in general terms (e.g. "your primary-care doctor") only when it reads naturally.
- Do NOT declare a value "normal" or "abnormal" as fact. Reference ranges vary by lab, age, and sex, so frame every value as something "worth asking your doctor to interpret against your lab's own reference range."
- Do NOT invent values or findings the user did not provide. Only discuss the data given.
- Keep a calm, non-alarming tone. Whatever the data shows, the right next step is always "discuss these with your doctor", plus the standing advice to seek urgent care for emergency symptoms (severe trouble breathing, chest pain, confusion, fainting).

STRUCTURE the response as short plain-text sections. Translate these headings into the requested output language:
1. "What your numbers show" — restate each lab value the user entered, in plain words, WITHOUT judging it high or low. If a wearable timeline is provided, describe in one or two sentences what it observed (for example, resting heart rate elevated for several days before symptoms began), framed as an observation, not a diagnosis.
2. "Questions to ask your doctor" — 3 to 5 specific, useful questions tied to the ACTUAL values and timeline provided (for example, "My CRP was X mg/L — what could explain that given how I feel?").
3. "Bring this to your appointment" — one sentence reminding the user to show the doctor the actual lab report and their wearable data.

End with a single-sentence disclaimer that this is information to discuss with a doctor, not a diagnosis.

Write the ENTIRE response in {locale_name}, in plain language a non-medical person understands, under about 350 words. Output only the summary text — no preamble such as "Here is the summary".`;

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err("ai_unconfigured", 503);
  }

  let body: LabsSummaryRequest;
  try {
    body = (await req.json()) as LabsSummaryRequest;
  } catch {
    return err("bad_request", 400);
  }

  const locale = body?.locale === "en" ? "en" : "ru";
  const labs = sanitizeLabs(body?.labs);
  const other = clip(body?.otherResults, MAX_OTHER_CHARS);
  const note = clip(body?.symptomsNote, MAX_NOTE_CHARS);
  const physio = body?.physio ?? null;

  if (labs.length === 0 && !other && !physio) {
    return err("no_input", 400);
  }

  const client = new Anthropic({ apiKey });
  const system = SYSTEM.replace(
    "{locale_name}",
    locale === "en" ? "English" : "Russian (русский язык)",
  );

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1600, // ~350 words fits comfortably; non-streaming is safe here
      system,
      messages: [
        { role: "user", content: buildUserMessage(labs, other, note, physio) },
      ],
    });

    // Opus 4.8 safety classifiers can decline (HTTP 200 + stop_reason "refusal").
    // Check before reading content — content may be empty on a refusal.
    if (resp.stop_reason === "refusal") {
      return err("refused", 422);
    }

    const summary = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!summary) {
      return err("empty", 502);
    }

    const payload: LabsSummaryResponse = { summary };
    return NextResponse.json(payload);
  } catch (e) {
    // Most-specific first: rate limit is retryable, other API errors are not.
    if (e instanceof Anthropic.RateLimitError) return err("rate_limited", 429);
    if (e instanceof Anthropic.APIError) return err("ai_error", 502);
    return err("server_error", 500);
  }
}

function err(code: string, status: number): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

function sanitizeLabs(input: unknown): LabEntry[] {
  if (!Array.isArray(input)) return [];
  const out: LabEntry[] = [];
  for (const item of input) {
    const key = (item as Partial<LabEntry>)?.key;
    const def = key ? LAB_BY_KEY[key] : undefined;
    if (!def) continue;
    const value = Number((item as Partial<LabEntry>)?.value);
    if (!Number.isFinite(value) || value < 0 || value > def.max) continue;
    out.push({ key: def.key, value });
  }
  return out;
}

function buildUserMessage(
  labs: LabEntry[],
  other: string,
  note: string,
  physio: PhysioSummary | null,
): string {
  const lines: string[] = [];

  if (labs.length) {
    lines.push(
      "Lab values the user entered (do NOT judge as high/low — the doctor interprets against the lab's own ranges):",
    );
    for (const l of labs) {
      const def = LAB_BY_KEY[l.key];
      lines.push(
        `- ${LAB_LABEL_EN[l.key]}: ${l.value} ${def.unit} (typical adult reference ${def.refHint})`,
      );
    }
  }

  if (other) {
    lines.push("", "Other results / notes the user typed:", other);
  }

  if (physio) {
    lines.push(
      "",
      "Wearable physiological timeline (from the app's changepoint detector — an early physiological signal, not a diagnosis):",
    );
    lines.push(
      `- Current illness-risk level: ${physio.riskLevel} (${physio.riskPct}% on the app's deviation scale).`,
    );
    if (physio.alarm) {
      lines.push("- The detector raised an early-warning alarm.");
    }
    if (physio.leadDays != null) {
      lines.push(
        `- That alarm fired about ${physio.leadDays} day(s) before the user's symptoms began.`,
      );
    }
    if (physio.topSignals.length) {
      const sig = physio.topSignals
        .map(
          (s) =>
            `${SIGNAL_EN[s.key] ?? s.key} ${s.z >= 0 ? "+" : ""}${s.z.toFixed(1)}σ from the user's baseline`,
        )
        .join("; ");
      lines.push(`- Signals deviating most: ${sig}.`);
    }
  }

  if (note) {
    lines.push("", "How the user says they feel:", note);
  }

  lines.push("", "Write the summary now, following all the rules.");
  return lines.join("\n");
}
