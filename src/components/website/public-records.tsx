import Link from "next/link";
import { catalogues, type Catalogue, localDate } from "@/lib/website/schema";
import { publicRecords, type PublicRecord } from "@/lib/website/records";
import { LibraryImage } from "./library-image";
export function RecordCards({ records }: { records: PublicRecord[] }) {
  return (
    <div className="public-card-grid">
      {records.map((r) => (
        <article key={r.id} className={"public-content-card kind-" + r.kind}>
          {r.media[0] ? (
            <Link
              tabIndex={-1}
              aria-hidden="true"
              href={"/" + catalogues[r.kind as Catalogue].path + "/" + r.id}
            >
              <LibraryImage id={r.media[0].id} alt="" />
            </Link>
          ) : (
            <div className="card-emblem" aria-hidden="true">
              {r.kind === "resources"
                ? "✦"
                : r.kind === "events"
                  ? "↗"
                  : r.kind === "leaders"
                    ? "✧"
                    : "✳"}
            </div>
          )}
          <div className="public-card-copy">
            <p className="eyebrow">
              {r.fields.role ||
                r.fields.category ||
                r.fields.activityStatus ||
                catalogues[r.kind as Catalogue].singular}
            </p>
            <h3>
              <Link
                href={"/" + catalogues[r.kind as Catalogue].path + "/" + r.id}
              >
                {r.fields.title}
              </Link>
            </h3>
            {r.fields.start || r.fields.date ? (
              <p className="card-date">
                {localDate(r.fields.start || r.fields.date)}
              </p>
            ) : null}
            <p>{r.fields.summary}</p>
            <Link
              className="text-link"
              href={"/" + catalogues[r.kind as Catalogue].path + "/" + r.id}
            >
              Read more <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
export async function PublicCollection({
  kind,
  q = "",
  cursor = "",
  heading,
}: {
  kind: Catalogue;
  q?: string;
  cursor?: string;
  heading?: string;
}) {
  const { records, nextCursor } = await publicRecords(
    kind,
    q.slice(0, 80),
    cursor.slice(0, 240),
  );
  return (
    <section className="public-collection" aria-label={catalogues[kind].label}>
      {heading ? (
        <div className="collection-heading">
          <p className="eyebrow">People. Faith. Purpose.</p>
          <h2>{heading}</h2>
        </div>
      ) : null}
      <form className="collection-search" method="get">
        <label htmlFor={"search-" + kind}>
          Find {catalogues[kind].label.toLowerCase()}
          <input
            id={"search-" + kind}
            name="q"
            defaultValue={q}
            maxLength={80}
            placeholder="Search by title…"
          />
        </label>
        <button className="button button-outline" type="submit">
          Search
        </button>
        {q ? (
          <Link className="text-link" href={"/" + catalogues[kind].path}>
            Clear search
          </Link>
        ) : null}
      </form>
      {records.length ? (
        <RecordCards records={records} />
      ) : (
        <div className="collection-empty">
          <span aria-hidden="true">✧</span>
          <h3>
            {q ? "No matching stories yet" : "A space for what comes next."}
          </h3>
          <p>
            {q
              ? "Try the beginning of a different title."
              : "Approved " +
                catalogues[kind].label.toLowerCase() +
                " will appear here as the ministry shares them."}
          </p>
        </div>
      )}
      {nextCursor ? (
        <Link
          className="button button-outline load-more"
          href={
            "?q=" +
            encodeURIComponent(q) +
            "&cursor=" +
            encodeURIComponent(nextCursor)
          }
        >
          More {catalogues[kind].label.toLowerCase()} →
        </Link>
      ) : null}
    </section>
  );
}
