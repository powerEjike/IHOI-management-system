import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  catalogues,
  type Catalogue,
  validContentId,
  localDate,
} from "@/lib/website/schema";
import { publicRecord } from "@/lib/website/records";
import { ContentText } from "@/components/website/content-text";
import { LibraryImage } from "@/components/website/library-image";
import { SupportedVideo } from "@/components/website/video-link";
export const dynamic = "force-dynamic";
function kindFor(slug: string) {
  return (Object.keys(catalogues) as Catalogue[]).find(
    (k) => catalogues[k].path === slug,
  );
}
async function entryData(params: Promise<{ slug: string; entry: string }>) {
  const p = await params,
    kind = kindFor(p.slug);
  if (!kind) return null;
  try {
    validContentId(p.entry);
  } catch {
    return null;
  }
  return publicRecord(kind, p.entry);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; entry: string }>;
}): Promise<Metadata> {
  const r = await entryData(params);
  return r ? { title: r.fields.title, description: r.fields.summary } : {};
}
export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string; entry: string }>;
}) {
  const record = await entryData(params);
  if (!record) notFound();
  const f = record.fields,
    kind = record.kind as Catalogue;
  return (
    <>
      <section className="container page-hero detail-hero">
        <Link className="text-link" href={"/" + catalogues[kind].path}>
          ← {catalogues[kind].label}
        </Link>
        <p className="eyebrow">
          {f.role || f.category || catalogues[kind].singular}
        </p>
        <h1>{f.title}</h1>
        <p className="page-description">{f.summary}</p>
        <div className="entry-facts">
          {f.start || f.date ? (
            <span>
              {localDate(f.start || f.date)}
              {f.end ? " – " + localDate(f.end) : ""}
            </span>
          ) : null}
          {f.location ? <span>{f.location}</span> : null}
          {f.activityStatus ? (
            <span className="record-badge">{f.activityStatus}</span>
          ) : null}
          {f.organizer ? <span>Organized by {f.organizer}</span> : null}
        </div>
      </section>
      <article className="container public-entry">
        <div
          className={
            "entry-photos " + (kind === "gallery" ? "album-photos" : "")
          }
        >
          {record.media.map((m) => (
            <figure key={m.id}>
              <LibraryImage id={m.id} alt={m.alt} />
              {kind === "gallery" ? <figcaption>{m.alt}</figcaption> : null}
            </figure>
          ))}
        </div>
        {f.activityStatus === "cancelled" ? (
          <p className="cancelled-notice">
            This event has been cancelled. Please check other ministry
            gatherings for current opportunities.
          </p>
        ) : null}
        {f.progress ? (
          <div className="project-progress">
            <label>
              Approved project progress: {f.progress}%
              <progress max="100" value={f.progress}>
                {f.progress}%
              </progress>
            </label>
          </div>
        ) : null}
        <ContentText text={f.body} />
        {f.link ? (
          <div className="entry-resource">
            <a
              className="button"
              href={f.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {kind === "courses" ? "Open learning materials" : "Open resource"}{" "}
              ↗
            </a>
            <p>Opens an external website.</p>
            {kind === "resources" && f.category === "Video" ? (
              <SupportedVideo url={f.link} />
            ) : null}
          </div>
        ) : null}
        {kind === "projects" || kind === "events" || kind === "outreach" ? (
          <div className="entry-cta">
            <h2>Be part of the story.</h2>
            <p>Explore how you can pray, serve, partner, or participate.</p>
            <Link className="button button-outline" href="/partner">
              Find your next step →
            </Link>
          </div>
        ) : null}
      </article>
    </>
  );
}
