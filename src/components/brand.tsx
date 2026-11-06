import Link from "next/link";
import Image from "next/image";

export function MinistryLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      className={className}
      src="/branding/ihoi-logo.png"
      width={320}
      height={320}
      sizes="(max-width: 760px) 240px, 320px"
      alt="International House of Incense Ministries — Worship, Word, Prophecy"
    />
  );
}

export function Brand() {
  return (
    <Link
      className="brand"
      href="/"
      aria-label="International House of Incense Ministries — home"
    >
      <Image
        src="/branding/ihoi-logo.png"
        width={64}
        height={64}
        alt=""
        className="brand-logo"
      />
      <span>
        <strong>
          IHOI<span className="brand-dot">.</span>
        </strong>
        <small>International House of Incense Ministries</small>
      </span>
    </Link>
  );
}
