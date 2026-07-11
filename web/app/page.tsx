import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { WhoopBand } from "@/components/WhoopBand";

// Use a real product photo the moment one is dropped into web/public,
// otherwise fall back to the self-contained SVG band.
function findBandPhoto(): string | null {
  const dir = path.join(process.cwd(), "public");
  for (const name of ["whoop-band.png", "whoop-band.webp", "whoop-band.jpg", "whoop-band.jpeg"]) {
    try {
      if (fs.existsSync(path.join(dir, name))) return "/" + name;
    } catch {}
  }
  return null;
}

export default function ConnectPage() {
  const bandPhoto = findBandPhoto();
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* left — hero */}
      <section className="relative flex flex-col px-7 py-10 sm:px-14 sm:py-14">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-[13px] font-semibold tracking-[0.22em] text-[color:var(--muted)] uppercase">
            Patient Zero
          </span>
        </div>

        <div className="my-auto max-w-[30rem] py-10">
          <h1 className="text-[2.6rem] sm:text-[3.25rem] font-bold leading-[1.05] tracking-[-0.02em]">
            Твой организм<br className="hidden sm:block" /> даёт сигналы{" "}
            <span className="text-[color:var(--brand)]">
              раньше&nbsp;симптомов.
            </span>
          </h1>

          <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--muted)] max-w-[24rem]">
            Мы анализируем твои сигналы, чтобы предупредить инфекцию за дни до
            первых признаков.
          </p>

          <Link
            href="/home"
            className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-white pl-2 pr-6 py-2 font-semibold text-[#0b0d10] hover:bg-white/90 transition-colors"
          >
            <span className="grid place-items-center w-9 h-9 rounded-full bg-[#0b0d10] text-white text-[13px] font-bold">
              W
            </span>
            Connect WHOOP
          </Link>

          <div className="mt-4 flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <LockIcon /> OAuth — безопасное подключение
          </div>
        </div>

        <p className="text-xs text-[color:var(--faint)]">
          Не медицинский прибор и не заменяет консультацию врача.
        </p>
      </section>

      {/* right — device */}
      <section className="relative hidden md:block overflow-hidden border-l border-[color:var(--border)]">
        <WhoopBand src={bandPhoto} />
      </section>
    </main>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
