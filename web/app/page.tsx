import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function ConnectPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="card w-full max-w-5xl grid md:grid-cols-2 overflow-hidden">
        {/* left — hero */}
        <div className="p-8 sm:p-12 flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <Logo />
            <span className="font-semibold text-lg tracking-tight">Patient Zero</span>
          </div>

          <h1 className="text-4xl sm:text-[2.75rem] leading-[1.08] font-bold tracking-tight">
            Твой Whoop знает, что ты заболеваешь,{" "}
            <span style={{ color: "var(--brand)" }}>раньше тебя.</span>
          </h1>

          <p className="muted mt-5 text-[15px] leading-relaxed max-w-sm">
            Мы анализируем сигналы твоего организма, чтобы предупредить инфекцию за
            дни до первых симптомов.
          </p>

          <Link
            href="/today"
            className="mt-8 inline-flex items-center gap-3 self-start rounded-xl bg-[#111418] text-white px-6 py-3.5 font-medium hover:bg-black transition-colors"
          >
            <span className="grid place-items-center w-6 h-6 rounded-full bg-white text-[#111418] text-xs font-bold">
              W
            </span>
            Connect Whoop
          </Link>

          <div className="muted mt-3 flex items-center gap-1.5 text-sm">
            <LockIcon /> OAuth — безопасное подключение
          </div>

          <p className="muted mt-auto pt-10 text-xs">
            Не медицинский прибор и не заменяет консультацию врача.
          </p>
        </div>

        {/* right — device panel */}
        <div className="relative hidden md:block bg-[radial-gradient(120%_100%_at_70%_0%,#eef1f5_0%,#e4e8ee_55%,#dfe3ea_100%)]">
          <BandArt />
        </div>
      </div>
    </main>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BandArt() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative w-56 h-56">
        <div className="absolute inset-0 rounded-full border-[26px] border-[#1b1e24] shadow-2xl" />
        <div className="absolute inset-[26px] rounded-full border border-[#2b2f36]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center w-12 h-8 rounded bg-[#0f1114] text-white/70 text-[10px] tracking-widest">
          WHOOP
        </div>
      </div>
    </div>
  );
}
