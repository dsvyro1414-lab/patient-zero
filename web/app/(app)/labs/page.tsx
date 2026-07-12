import { getDemo } from "@/lib/api";
import { buildForecast } from "@/lib/forecast";
import { pickToday } from "@/lib/status";
import { LabsSummary } from "@/components/LabsSummary";
import type { PhysioSummary } from "@/lib/labs";

export const dynamic = "force-dynamic";

// The labs screen works standalone (manual entry). When the wearable demo is
// available we attach a compact physiological timeline — the same detector
// output the rest of the app shows — so Claude can tie "RHR elevated 3 days
// before symptoms" to the entered lab values. This is the loop-closer:
// wearable signal → confirmatory test → summary for the doctor.
export default async function LabsPage() {
  const demo = await getDemo();

  let physio: PhysioSummary | null = null;
  if (demo && demo.records.length > 0) {
    const fc = buildForecast(demo);
    const today = pickToday(demo);
    const lead =
      demo.onset_day != null &&
      demo.first_alarm_day != null &&
      demo.first_alarm_day < demo.onset_day
        ? demo.onset_day - demo.first_alarm_day
        : null;

    physio = {
      riskLevel: fc.today.level,
      riskPct: fc.today.pct,
      alarm: today.alarm,
      leadDays: lead,
      topSignals: [...today.why]
        .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
        .slice(0, 3)
        .map((w) => ({ key: w.signal, z: w.z })),
    };
  }

  return <LabsSummary physio={physio} />;
}
