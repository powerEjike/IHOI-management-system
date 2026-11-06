import Link from "next/link";
import { catalogues } from "@/lib/website/schema";
import { requireStaff } from "@/lib/auth/session";
import { Workspace } from "@/components/portal/workspace";
import { editablePages } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function WebsitePage() {
  const staff = await requireStaff();
  return (
    <Workspace staff={staff} title="Website content" eyebrow="Publication desk">
      <p className="workspace-notice">
        Manage page copy, ministry stories, people, photographs and public
        enquiries. Drafts stay private until explicitly published.
      </p>
      <div className="website-desk-actions">
        <Link className="button" href="/portal/website/media">
          Media & permissions
        </Link>
        <Link
          className="button button-outline"
          href="/portal/website/catalog/settings/main"
        >
          Contact & website settings
        </Link>
        <Link
          className="button button-outline"
          href="/portal/website/enquiries"
        >
          Enquiry inbox
        </Link>
      </div>
      <h2>Ministry collections</h2>
      <div className="leadership-grid">
        {Object.entries(catalogues).map(([kind, c]) => (
          <article className="workspace-panel" key={kind}>
            <p className="eyebrow">Website collection</p>
            <h2>{c.label}</h2>
            <Link
              className="text-link"
              href={"/portal/website/catalog/" + kind}
            >
              Manage {c.label.toLowerCase()} →
            </Link>
          </article>
        ))}
      </div>
      <h2>Pages & homepage</h2>
      <div className="leadership-grid">
        {Object.entries(editablePages).map(([slug, page]) => (
          <article className="workspace-panel" key={slug}>
            <p className="eyebrow">/{slug}</p>
            <h2>{page.label}</h2>
            <p>{page.description}</p>
            <Link className="text-link" href={"/portal/website/" + slug}>
              Edit page →
            </Link>
          </article>
        ))}
      </div>
    </Workspace>
  );
}
