import type { Metadata } from "next";
import { PublicCollection } from "@/components/website/public-records";
export const metadata: Metadata = {
  title: "Events",
  description:
    "Gatherings and upcoming opportunities at International House of Incense Ministries.",
};
export const dynamic = "force-dynamic";
export default async function Events({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const q = await searchParams;
  return (
    <>
      <section className="container page-hero">
        <p className="eyebrow">Gather. Grow. Go.</p>
        <h1>A place to come together.</h1>
        <p className="page-description">
          Discover ministry gatherings, teaching, and opportunities to serve.
        </p>
      </section>
      <div className="container page-body">
        <PublicCollection kind="events" q={q.q} cursor={q.cursor} />
      </div>
    </>
  );
}
