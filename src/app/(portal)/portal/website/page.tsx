import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { Workspace } from "@/components/portal/workspace";
import { pages } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function WebsitePage() {
  const staff = await requireStaff();
  return (
    <Workspace staff={staff} title="Website content" eyebrow="Publication desk">
      <p className="workspace-notice">
        Edit page introductions and main text. Save privately, preview, then
        explicitly publish. Resource catalogues, media, the homepage, and
        submission forms are managed in later milestones.
      </p>
      <div className="leadership-grid">
        {Object.entries(pages).map(([slug, page]) => (
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
