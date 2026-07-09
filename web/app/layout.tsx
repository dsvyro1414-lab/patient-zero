import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Zero — pre-symptomatic illness radar",
  description:
    "Your Whoop knows you're getting sick before you do. Alerts 1–3 days before the first symptom.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
