import Link from "next/link";

export function Flame({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="40"
      viewBox="0 0 64 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M34 3C40 24 12 25 17 45C7 41 7 31 8 27C-9 53 8 77 31 77C59 77 71 48 50 25C54 45 42 48 39 42C31 29 48 22 34 3Z"
        fill="currentColor"
      />
      <path
        d="M31 47C34 57 23 61 26 70C40 72 47 60 39 51C39 60 33 60 31 47Z"
        fill="var(--paper, #faf8f2)"
      />
    </svg>
  );
}

export function Brand() {
  return (
    <Link
      className="brand"
      href="/"
      aria-label="International House of Incense — home"
    >
      <Flame />
      <span>
        <strong>
          IHOI<span className="brand-dot">.</span>
        </strong>
        <small>International House of Incense</small>
      </span>
    </Link>
  );
}
