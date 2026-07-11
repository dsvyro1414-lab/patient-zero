import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/locale-server";
import { LocaleProvider } from "@/components/LocaleProvider";

export const metadata: Metadata = {
  title: "Patient Zero — pre-symptomatic illness radar",
  description:
    "Your Whoop knows you're getting sick before you do. Alerts 1–3 days before the first symptom.",
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
