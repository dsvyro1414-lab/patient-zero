// The Connect hero device. If a real WHOOP photo exists at /whoop-band.*, show it
// on a dark studio stage; otherwise render a detailed, self-contained SVG band
// modelled on the WHOOP 4.0 SuperKnit strap — deploy-safe, no external assets.
export function WhoopBand({ src }: { src?: string | null }) {
  if (src) {
    return (
      <Stage>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Браслет WHOOP"
          className="w-[82%] max-w-[480px] object-contain drop-shadow-[0_40px_70px_rgba(0,0,0,0.6)]"
        />
      </Stage>
    );
  }
  return (
    <Stage>
      <svg
        viewBox="0 0 480 480"
        className="w-[80%] max-w-[460px] drop-shadow-[0_50px_70px_rgba(0,0,0,0.6)]"
        role="img"
        aria-label="Носимый браслет WHOOP"
      >
        <defs>
          {/* strap top face — lit from upper-left */}
          <linearGradient id="face" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#40444c" />
            <stop offset="0.35" stopColor="#23262c" />
            <stop offset="0.72" stopColor="#141619" />
            <stop offset="1" stopColor="#0a0b0d" />
          </linearGradient>
          {/* darker wall giving the strap visible thickness */}
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c0d10" />
            <stop offset="1" stopColor="#050607" />
          </linearGradient>
          {/* bright rim that catches light on the outer top edge */}
          <linearGradient id="rim" x1="0.1" y1="0" x2="0.85" y2="0.9">
            <stop offset="0" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="0.28" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* brushed-metal module rails */}
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9ebee" />
            <stop offset="0.28" stopColor="#a6aab1" />
            <stop offset="0.55" stopColor="#565a62" />
            <stop offset="0.78" stopColor="#9da1a8" />
            <stop offset="1" stopColor="#d9dce0" />
          </linearGradient>
          <linearGradient id="pod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2d33" />
            <stop offset="1" stopColor="#0d0e11" />
          </linearGradient>
          <radialGradient id="reflect" cx="0.35" cy="0.28" r="0.5">
            <stop offset="0" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* woven knit texture */}
          <pattern id="knitA" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <path d="M0 0V8" stroke="rgba(255,255,255,0.06)" strokeWidth="2.6" />
            <path d="M4 0V8" stroke="rgba(0,0,0,0.4)" strokeWidth="2.6" />
          </pattern>
          <pattern id="knitB" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
            <path d="M0 0V8" stroke="rgba(255,255,255,0.035)" strokeWidth="2.4" />
          </pattern>

          {/* the strap ring: outer ellipse minus inner ellipse (evenodd) */}
          <path id="ring" fillRule="evenodd"
            d="M78 240 a162 132 0 1 0 324 0 a162 132 0 1 0 -324 0 Z
               M126 240 a114 84 0 1 1 228 0 a114 84 0 1 1 -228 0 Z" />
          <clipPath id="ringClip"><use href="#ring" /></clipPath>
        </defs>

        <g transform="rotate(-16 240 240)">
          {/* soft contact shadow */}
          <ellipse cx="248" cy="404" rx="158" ry="28" fill="rgba(0,0,0,0.55)"
            style={{ filter: "blur(12px)" }} />

          {/* strap thickness (wall), drawn slightly lower/behind the top face */}
          <g transform="translate(0 13)">
            <use href="#ring" fill="url(#wall)" />
          </g>

          {/* strap top face */}
          <use href="#ring" fill="url(#face)" />

          {/* woven texture + inner shading, clipped to the strap */}
          <g clipPath="url(#ringClip)">
            <use href="#ring" fill="url(#knitA)" />
            <use href="#ring" fill="url(#knitB)" />
            <ellipse cx="240" cy="240" rx="162" ry="132" fill="url(#reflect)" />
          </g>

          {/* inner-hole shadow + outer rim light */}
          <path d="M126 240 a114 84 0 1 1 228 0 a114 84 0 1 1 -228 0 Z"
            fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3" />
          <path d="M126 240 a114 84 0 1 1 228 0 a114 84 0 1 1 -228 0 Z"
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" transform="translate(0 -1)" />
          <path d="M78 240 a162 132 0 1 0 324 0 a162 132 0 1 0 -324 0 Z"
            fill="none" stroke="url(#rim)" strokeWidth="2.4" />

          {/* sensor module at the front-bottom of the loop */}
          <g transform="translate(240 322)">
            {/* metal rails top & bottom */}
            <rect x="-52" y="-30" width="104" height="10" rx="5" fill="url(#metal)" />
            <rect x="-52" y="20" width="104" height="10" rx="5" fill="url(#metal)" />
            {/* body */}
            <rect x="-52" y="-22" width="104" height="44" rx="7" fill="url(#pod)"
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <rect x="-52" y="-22" width="104" height="16" rx="7" fill="rgba(255,255,255,0.05)" />
            {/* W mark */}
            <path d="M-17 -8 L-11 9 L-4 -3 L3 9 L9 -8"
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.4"
              strokeLinejoin="round" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </Stage>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_58%_34%,#1a1d23_0%,#0e1014_46%,#08090b_100%)]">
      {children}
    </div>
  );
}
