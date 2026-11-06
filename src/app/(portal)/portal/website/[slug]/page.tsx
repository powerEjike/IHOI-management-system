import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { Workspace } from "@/components/portal/workspace";
import { isEditableSlug, editablePages } from "@/lib/content";
import { readEditor } from "@/lib/website/service";
import { PageEditor } from "@/components/website/page-editor";
export const dynamic = "force-dynamic";
export default async function EditWebsitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const staff = await requireStaff();
  const { slug } = await params;
  if (!isEditableSlug(slug)) notFound();
  const data = await readEditor(slug);
  return (
    <Workspace
      staff={staff}
      title={editablePages[slug].label + " page"}
      eyebrow="Website editor"
    >
      <PageEditor key={data.version} data={data} />
    </Workspace>
  );
}
