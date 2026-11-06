import { PublicCollection } from "@/components/website/public-records";
import { PublicEnquiries } from "@/components/website/contact-details";
import { ContentText } from "@/components/website/content-text";
import { catalogues, type Catalogue } from "@/lib/website/schema";
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  const page = pages[slug];
  const query = await searchParams;
  const kind = (Object.keys(catalogues) as Catalogue[]).find(
    (k) => catalogues[k].path === slug,
  );
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
            <ContentText text={copy.body} />
          </article>
        ) : kind || slug === "contact" || slug === "volunteer" ? null : (
          <EmptyState
            title={page.emptyTitle}
            href={page.href}
            action={page.next}
          >
            <p>{page.emptyText}</p>
          </EmptyState>
        )}
        {kind ? (
          <PublicCollection
            kind={kind}
            q={query.q}
            cursor={query.cursor}
            heading={slug === "about" ? "Meet the leadership" : undefined}
          />
        ) : null}
        {slug === "contact" || slug === "volunteer" ? (
          <PublicEnquiries kind={slug} />
        ) : null}
      </section>
    </>
  );
}
