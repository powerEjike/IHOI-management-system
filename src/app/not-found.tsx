import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="container prose-page">
      <p className="eyebrow">404 / Page not found</p>
      <h1>Let’s find your way back.</h1>
      <p>The page you’re looking for isn’t available.</p>
      <Link href="/" className="button">
        Return home <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}
