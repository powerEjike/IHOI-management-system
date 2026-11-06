import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { getConvert } from "@/lib/converts/service";
import { ConvertError } from "@/lib/converts/model";
import { Workspace } from "@/components/portal/workspace";
import { ConvertForm } from "@/components/converts/convert-form";
export const dynamic = "force-dynamic";
export default async function EditConvertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  let record;
  try {
    record = await getConvert(id);
  } catch (error) {
    if (error instanceof ConvertError && error.code === "not_found") notFound();
    throw error;
  }
  if (record.archived) redirect(`/portal/converts/${id}`);
  return (
    <Workspace staff={staff} title="Edit convert record">
      <ConvertForm
        key={record.revision}
        record={record}
        requestId={randomUUID()}
      />
    </Workspace>
  );
}
