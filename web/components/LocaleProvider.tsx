"use client";

import { createContext, useContext } from "react";
import { dict, DEFAULT_LOCALE, type Locale, type Dict } from "@/lib/i18n";

// The locale comes from the server (cookie) via the root layout, so the value is
// identical on the server render and the client hydrate — no mismatch.
const LocaleCtx = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleCtx);
}

export function useT(): Dict {
  return dict[useContext(LocaleCtx)];
}
