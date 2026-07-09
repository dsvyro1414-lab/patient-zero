"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/today", label: "Today", icon: HomeIcon },
  { href: "/replay", label: "Replay", icon: PlayIcon },
  { href: "/report", label: "Report", icon: ChartIcon },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="card m-3 sm:m-4 p-3 sm:p-4 w-full md:w-56 md:min-h-[calc(100vh-2rem)] flex md:flex-col gap-1 shrink-0">
      <div className="hidden md:flex items-center gap-2 px-2 py-3 mb-2">
        <Logo size={24} />
        <span className="font-semibold tracking-tight">Patient Zero</span>
      </div>
      <nav className="flex md:flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[color:var(--brand)]/10 text-[color:var(--brand)]"
                  : "muted hover:bg-black/[0.04]"
              }`}
            >
              <Icon /> {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium muted hover:bg-black/[0.04]"
      >
        <LogoutIcon /> Logout
      </Link>
    </aside>
  );
}

const sw = { strokeWidth: 1.8, stroke: "currentColor", fill: "none" } as const;
function HomeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...sw}><path d="M4 11 12 4l8 7" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PlayIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...sw}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M10 9l5 3-5 3V9Z" fill="currentColor" stroke="none" /></svg>;
}
function ChartIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...sw}><path d="M4 20V4M4 20h16" strokeLinecap="round" /><path d="M8 16l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...sw}><path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
