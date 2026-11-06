import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Staff access",
  robots: { index: false, follow: false },
};
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="portal-boundary">
      {children}
    </main>
  );
}
