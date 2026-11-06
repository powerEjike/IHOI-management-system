import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publishedPage } from "@/lib/website/service";
import { EmptyState } from "@/components/empty-state";
import { isPageSlug, pages } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isPageSlug(slug)) return {};
  const copy = await publishedPage(slug);
  return {
    title: copy?.title || pages[slug].label,
    description: copy?.description || pages[slug].description,
  };
}
export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  const page = pages[slug];
  const copy = await publishedPage(slug);
  return (
    <>
      <section className="page-hero container">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{copy?.title || page.title}</h1>
        <p className="page-description">
          {copy?.description || page.description}
        </p>
      </section>
      <section className="container page-body">
        {copy ? (
          <article className="published-copy">
            <h2>{copy.heading}</h2>
            {copy.body.split(/\n\s*\n/).map((paragraph, index) => (
              <p
                key={index}
                style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {paragraph}
              </p>
            ))}
          </article>
        ) : (
          <EmptyState
            title={page.emptyTitle}
            href={page.href}
            action={page.next}
          >
            <p>{page.emptyText}</p>
          </EmptyState>
        )}
      </section>
    </>
  );
}
