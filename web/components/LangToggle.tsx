"use client";

import { useLocale } from "./LocaleProvider";
import { LOCALES, type Locale } from "@/lib/i18n";

// RU/EN switch. Persists to a cookie and reloads so server + client re-render
// consistently (a full reload avoids any client/server locale desync).
export function LangToggle() {
  const locale = useLocale();

  const set = (l: Locale) => {
    if (l === locale) return;
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-1" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          aria-pressed={l === locale}
          className={`w-9 h-7 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
            l === locale
              ? "text-[color:var(--brand)]"
              : "text-[color:var(--faint)] hover:text-[color:var(--text)] hover:bg-[color:var(--hover)]"
          }`}
          style={l === locale ? { background: "rgba(34,197,94,0.13)" } : undefined}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
