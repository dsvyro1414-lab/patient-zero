import type { Band } from "@/lib/status";

const ACTIONS: Record<Band, string[]> = {
  red: [
    "Отдыхай сегодня, избегай интенсивных нагрузок",
    "Пей больше воды",
    "Сделай тест, если появятся симптомы",
    "Избегай контактов, чтобы не заразить близких",
  ],
  amber: [
    "Отдохни сегодня, избегай интенсивных нагрузок",
    "Пей больше воды",
    "Рассмотри тестирование, если будут симптомы",
    "Избегай контактов, если почувствуешь недомогание",
  ],
  green: [
    "Продолжай в том же духе",
    "Держи режим сна и восстановления",
    "Тренируйся по плану",
  ],
};

export function ActionCard({ band }: { band: Band }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">Что делать сейчас</h3>
      <ul className="space-y-2.5">
        {ACTIONS[band].map((a) => (
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
