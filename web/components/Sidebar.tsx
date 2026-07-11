"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/home", label: "Главная", icon: HomeIcon },
  { href: "/forecast", label: "Прогноз", icon: ForecastIcon },
  { href: "/today", label: "Статус", icon: PulseIcon },
  { href: "/replay", label: "Таймлайн", icon: ActivityIcon },
  { href: "/report", label: "Метрики", icon: ReportIcon },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 z-10 h-screen w-[68px] shrink-0 flex flex-col items-center border-r border-[color:var(--border)] bg-[color:var(--panel)] py-5">
      <Link href="/" aria-label="Patient Zero" title="Patient Zero"
        className="grid place-items-center w-11 h-11 rounded-xl bg-[color:var(--brand)]/10 border border-[color:var(--brand)]/20">
        <Logo size={24} />
      </Link>

      <nav className="mt-7 flex flex-col gap-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? "page" : undefined}
              className={`grid place-items-center w-11 h-11 rounded-xl transition-colors ${
                active
                  ? "bg-[color:var(--brand)]/12 text-[color:var(--brand)]"
                  : "text-[color:var(--muted)] hover:bg-[color:var(--hover)] hover:text-[color:var(--text)]"
              }`}
              style={active ? { background: "rgba(34,197,94,0.13)" } : undefined}
            >
              <Icon />
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        aria-label="Logout"
        title="Logout"
        className="mt-auto grid place-items-center w-11 h-11 rounded-xl text-[color:var(--muted)] hover:bg-[color:var(--hover)] hover:text-[color:var(--text)] transition-colors"
      >
        <LogoutIcon />
      </Link>
    </aside>
  );
}

const sw = { strokeWidth: 1.7, stroke: "currentColor", fill: "none" } as const;

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...sw}>
      <path d="M4 11 12 4l8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.8V19h12V9.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ForecastIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...sw}>
      <path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6L12 3Z"
        strokeLinejoin="round" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"
        strokeLinejoin="round" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...sw}>
      <path d="M20.8 5.6a5 5 0 0 0-8.8-1.4A5 5 0 0 0 3.2 8c0 4.4 5.9 8.4 8.8 10 1.6-.9 4.2-2.6 6-4.8"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12h2.5l1.5-3 2 5 1.3-2H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...sw}>
      <path d="M3 12h3.5l2.5-7 4 14 2.6-7H21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...sw}>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 8.5h6M9 12h6M9 15.5h4" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...sw}>
      <path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
