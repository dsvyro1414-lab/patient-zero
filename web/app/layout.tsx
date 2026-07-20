import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/locale-server";
import { LocaleProvider } from "@/components/LocaleProvider";

export const metadata: Metadata = {
  title: "Patient Zero — wearable research demo",
  description:
    "A retrospective research demo of wearable-signal shifts relative to a personal baseline.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
