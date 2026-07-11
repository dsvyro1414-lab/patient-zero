import type { Band } from "@/lib/status";
import type { Dict } from "@/lib/i18n";

export function ActionCard({ band, t }: { band: Band; t: Dict["actions"] }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">{t.title}</h3>
      <ul className="space-y-2.5">
        {t[band].map((a) => (
          <li key={a} className="flex items-start gap-2.5 text-sm">
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--brand)" }}
            />
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
