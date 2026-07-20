"use client";

import { useT } from "./LocaleProvider";

export function ResearchDemoBanner() {
  const t = useT().demo;

  return (
    <div
      className="mb-5 flex flex-col gap-1 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "rgba(96,165,250,0.32)", background: "rgba(96,165,250,0.08)" }}
      role="status"
    >
      <div className="font-semibold" style={{ color: "var(--blue)" }}>
        {t.badge}
      </div>
      <div className="muted text-xs sm:text-right">{t.notice}</div>
    </div>
  );
}
