export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 2 4 7v8c0 7.2 4.9 12.9 12 15 7.1-2.1 12-7.8 12-15V7L16 2Z"
        fill="var(--brand)"
        opacity="0.16"
      />
      <path
        d="M16 2 4 7v8c0 7.2 4.9 12.9 12 15 7.1-2.1 12-7.8 12-15V7L16 2Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 16h4l2-5 3 9 2-4h5"
        stroke="var(--brand)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
