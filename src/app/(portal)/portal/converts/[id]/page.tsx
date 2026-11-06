import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { convertHistory, getConvert } from "@/lib/converts/service";
import { ConvertError } from "@/lib/converts/model";
import { Workspace } from "@/components/portal/workspace";
import { ArchiveForm } from "@/components/converts/archive-form";
export const dynamic = "force-dynamic";
export default async function ConvertPage({
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
  const history = await convertHistory(id);
  const lead =
    record.assignedLeaderRole === "super_admin"
      ? "Super Admin"
      : record.assignedLeaderRole === "president"
        ? "President"
        : record.assignedLeaderRole === "coo"
          ? "COO"
          : "Unassigned";
  const facts = [
    ["Phone", record.phone || "Not recorded"],
    ["Email", record.email || "Not recorded"],
    ["Location", record.location || "Not recorded"],
    ["Registered", record.registeredDate],
    ["Ministry stage", record.stage],
    ["Follow-up lead", lead],
    ["Contact permission", record.contactPermission],
    ["Permission date", record.consentDate || "Not recorded"],
    ["Permission source", record.consentSource || "Not recorded"],
    ["No contact details reason", record.noContactReason || "Not applicable"],
  ];
  return (
    <Workspace
      staff={staff}
      title={record.fullName}
      eyebrow={
        record.archived ? "Archived convert record" : "Private convert record"
      }
    >
      <div className="workspace-toolbar">
        <Link href="/portal/converts" className="text-link">
          ← Back to register
        </Link>
        {!record.archived ? (
          <Link href={`/portal/converts/${id}/edit`} className="button">
            Edit record ↗
          </Link>
        ) : (
          <span className="record-badge">Archived</span>
        )}
      </div>
      <section className="workspace-panel">
        <dl className="record-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div
          className={`contact-notice permission-${record.contactPermission}`}
        >
          {record.contactPermission === "declined"
            ? "Contact permission was declined. Do not schedule outreach contact."
            : record.contactPermission === "unknown"
              ? "Contact permission is unknown. Review it before making contact."
              : "Contact permission is recorded as granted."}
        </div>
        <h2>Private ministry notes</h2>
        <p className="record-notes">{record.notes || "No notes recorded."}</p>
        <ArchiveForm
          key={record.revision}
          id={id}
          revision={record.revision}
          archived={record.archived}
        />
      </section>
      <section className="workspace-panel">
        <h2>Record history</h2>
        <p>
          Latest 20 changes. Notes and contact details are not copied into this
          history.
        </p>
        <ol className="record-history">
          {history.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.action.replaceAll("_", " ")}</strong>
              <span>
                {entry.actorName} ·{" "}
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: "Africa/Lagos",
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(entry.date))}
              </span>
              {entry.reason ? <p>{entry.reason}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </Workspace>
  );
}
