"use client";
import Link from "next/link";
export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <section className="container page-body">
      <div className="collection-empty">
        <p className="eyebrow">Please try again</p>
        <h1>We couldn’t load this page just now.</h1>
        <p>The latest ministry information is temporarily unavailable.</p>
        <div className="button-row">
          <button className="button" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="button button-outline">
            Go to the homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
