import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, dict, type Locale, type Dict } from "./i18n";

// Server-side locale, read from the `lang` cookie (set by the RU/EN toggle).
export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("lang")?.value as Locale | undefined;
  return v && LOCALES.includes(v) ? v : DEFAULT_LOCALE;
}

export async function getT(): Promise<Dict> {
  return dict[await getLocale()];
}
