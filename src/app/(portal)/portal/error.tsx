"use client";
import Link from "next/link";
export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <div className="portal-card">
      <p className="eyebrow">Workspace unavailable</p>
      <h1>
        We couldn’t load
        <br />
        <em>this page.</em>
      </h1>
      <p>
        Your records have not been changed. Please retry, or return to the
        overview.
      </p>
      <div className="button-row">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-outline" href="/portal/dashboard">
          Overview
        </Link>
      </div>
    </div>
  );
}
