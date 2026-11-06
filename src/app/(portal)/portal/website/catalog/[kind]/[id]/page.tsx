import { notFound } from "next/navigation";
import { Workspace } from "@/components/portal/workspace";
import { requireStaff } from "@/lib/auth/session";
import { contentKind, validContentId, catalogues } from "@/lib/website/schema";
import { privateRecord } from "@/lib/website/records";
import { library } from "@/lib/website/media";
import { RecordEditor } from "@/components/website/record-editor";
export const dynamic = "force-dynamic";
export default async function EditRecord({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const staff = await requireStaff();
  const p = await params;
  let kind, id;
  try {
    kind = contentKind(p.kind);
    id = validContentId(p.id);
  } catch {
    notFound();
  }
  if (
    (kind === "settings" && id !== "main") ||
    (kind !== "settings" && id === "main")
  )
    notFound();
  const [{ record, history }, media] = await Promise.all([
    privateRecord(kind, id),
    kind === "settings" ? Promise.resolve([]) : library(),
  ]);
  return (
    <Workspace
      staff={staff}
      title={
        kind === "settings"
          ? "Contact & website settings"
          : catalogues[kind].singular + " editor"
      }
      eyebrow="Publication desk"
    >
      <RecordEditor
        key={record.version}
        record={record}
        history={history}
        media={media}
      />
    </Workspace>
  );
}
