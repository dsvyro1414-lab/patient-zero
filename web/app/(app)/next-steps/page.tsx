import { getDemo } from "@/lib/api";
import { buildForecast } from "@/lib/forecast";
import { NextSteps } from "@/components/NextSteps";
import type { RiskLevel } from "@/lib/triage";

export const dynamic = "force-dynamic";

// The triage screen works standalone (symptoms only). If the wearable demo is
// available we seed it with the SAME risk level the rest of the app shows
// (derived from the detector's Health Deviation Index, not the classifier).
export default async function NextStepsPage() {
  const demo = await getDemo();
  const wearableAvailable = !!demo && demo.records.length > 0;
  const risk: RiskLevel = wearableAvailable ? buildForecast(demo!).today.level : "low";

  return <NextSteps risk={risk} wearableAvailable={wearableAvailable} />;
}
