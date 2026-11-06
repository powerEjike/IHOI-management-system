import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { isPageSlug, pages } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return isPageSlug(slug)
    ? { title: pages[slug].label, description: pages[slug].description }
    : {};
}
export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  const page = pages[slug];
  return (
    <>
      <section className="page-hero container">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p className="page-description">{page.description}</p>
      </section>
      <section className="container page-body">
        <EmptyState title={page.emptyTitle} href={page.href} action={page.next}>
          <p>{page.emptyText}</p>
        </EmptyState>
      </section>
    </>
  );
}
