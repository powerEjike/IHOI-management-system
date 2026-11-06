import { randomUUID } from "node:crypto";
import { requireStaff } from "@/lib/auth/session";
import { Workspace } from "@/components/portal/workspace";
import { ConvertForm } from "@/components/converts/convert-form";
export const dynamic = "force-dynamic";
export default async function NewConvertPage() {
  const staff = await requireStaff();
  return (
    <Workspace staff={staff} title="Register a convert">
      <ConvertForm requestId={randomUUID()} />
    </Workspace>
  );
}
