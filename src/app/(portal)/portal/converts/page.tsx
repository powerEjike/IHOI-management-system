import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { listConverts } from "@/lib/converts/service";
import { Workspace } from "@/components/portal/workspace";
import { ConvertList } from "@/components/converts/convert-list";
export const dynamic = "force-dynamic";
export default async function ConvertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const filters = {
    q: "",
    stage:
      typeof params.stage === "string" &&
      ["convert", "disciple", "worker"].includes(params.stage)
        ? params.stage
        : "all",
    lead:
      typeof params.lead === "string" &&
      ["super_admin", "president", "coo", "unassigned"].includes(params.lead)
        ? params.lead
        : "all",
    recent: params.recent === "1",
    archived: params.archived === "1",
  };
  const initial = await listConverts(filters);
  return (
    <Workspace staff={staff} title="Converts register">
      <div className="workspace-toolbar">
        <p>
          Manually registered people, their ministry stage, and follow-up
          responsibility.
        </p>
        <Link href="/portal/converts/new" className="button">
          Register convert <span aria-hidden="true">＋</span>
        </Link>
      </div>
      <ConvertList initial={initial} initialFilters={filters} />
    </Workspace>
  );
}
