import Link from "next/link";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/portal/workspace";
import { requireStaff } from "@/lib/auth/session";
import { catalogues, type Catalogue } from "@/lib/website/schema";
import { privateRecords, newContentId } from "@/lib/website/records";
export const dynamic = "force-dynamic";
export default async function CataloguePage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const staff = await requireStaff();
  const { kind } = await params;
  if (!Object.hasOwn(catalogues, kind)) notFound();
  const k = kind as Catalogue,
    rows = await privateRecords(k);
  return (
    <Workspace
      staff={staff}
      title={catalogues[k].label}
      eyebrow="Website collection"
    >
      <div className="button-row">
        <Link href="/portal/website">← Website desk</Link>
        <Link
          className="button"
          href={"/portal/website/catalog/" + k + "/" + newContentId()}
        >
          Add {catalogues[k].singular.toLowerCase()}
        </Link>
      </div>
      <p>Latest 100 items. Drafts are private until explicitly published.</p>
      <div className="leadership-grid">
        {rows.map((r) => (
          <article className="workspace-panel" key={r.id}>
            <p className="eyebrow">{r.status}</p>
            <h2>{r.draft.title}</h2>
            <p>{r.draft.summary}</p>
            <Link href={"/portal/website/catalog/" + k + "/" + r.id}>
              Edit item →
            </Link>
          </article>
        ))}
      </div>
      {!rows.length ? (
        <div className="workspace-panel">
          <h2>Ready for your first {catalogues[k].singular.toLowerCase()}</h2>
          <p>
            Add approved ministry content when it is available. Nothing
            fictional is published.
          </p>
        </div>
      ) : null}
    </Workspace>
  );
}
