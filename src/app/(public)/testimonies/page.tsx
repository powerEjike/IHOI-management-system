import type { Metadata } from "next";
import { PublicCollection } from "@/components/website/public-records";
export const metadata: Metadata = {
  title: "Testimonies",
  description:
    "Approved stories of faith and transformation from the ministry.",
};
export const dynamic = "force-dynamic";
export default async function Testimonies({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const q = await searchParams;
  return (
    <>
      <section className="container page-hero">
        <p className="eyebrow">Stories of faith</p>
        <h1>Grace in everyday lives.</h1>
        <p className="page-description">
          Stories shared with permission, to encourage faith and give thanks.
        </p>
      </section>
      <div className="container page-body">
        <PublicCollection kind="testimonies" q={q.q} cursor={q.cursor} />
      </div>
    </>
  );
}
