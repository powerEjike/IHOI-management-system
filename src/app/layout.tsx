import type { Metadata } from "next";
import { parseSiteUrl, site } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${site.shortName} — Faith. People. Purpose.`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
