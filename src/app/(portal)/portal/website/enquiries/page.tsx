import Link from "next/link";
import { Workspace } from "@/components/portal/workspace";
import { requireStaff } from "@/lib/auth/session";
import { enquiryInbox } from "@/lib/website/submissions";
import { ReviewEnquiry } from "@/components/website/inbox";
export const dynamic = "force-dynamic";
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const staff = await requireStaff();
  const { rows, nextCursor } = await enquiryInbox((await searchParams).cursor);
  return (
    <Workspace
      staff={staff}
      title="Website enquiries"
      eyebrow="Private leadership inbox"
    >
      <p>
        Contact, partnership and adult volunteer enquiries. Submission does not
        create a member, worker or leadership account. Replies are handled by
        leadership; this app does not send emails.
      </p>
      <Link href="/portal/website">← Website desk</Link>
      {rows.map((row) => (
        <article className="workspace-panel enquiry-item" key={row.id}>
          <p className="eyebrow">
            {row.kind} · {row.status} ·{" "}
            {new Date(row.createdAt).toLocaleString("en-GB", {
              timeZone: "Africa/Lagos",
            })}
          </p>
          <h2>{row.fields.name}</h2>
          {row.kind === "volunteer" ? (
            <p>
              Age declaration:{" "}
              {row.adult
                ? "18 or older"
                : "Under 18 · safeguarding review required before any role approval"}
            </p>
          ) : null}
          <p>
            {row.fields.email}
            {row.fields.phone ? " · " + row.fields.phone : ""}
          </p>
          {row.fields.interest ? <p>Interest: {row.fields.interest}</p> : null}
          {row.fields.availability ? (
            <p>Availability: {row.fields.availability}</p>
          ) : null}
          <p style={{ whiteSpace: "pre-wrap" }}>{row.fields.message}</p>
          <ReviewEnquiry
            key={row.revision}
            id={row.id}
            status={row.status}
            revision={row.revision}
          />
        </article>
      ))}
      {!rows.length ? (
        <div className="workspace-panel">
          <h2>No enquiries yet</h2>
          <p>
            Publish approved contact information and privacy wording in Website
            settings before opening public forms.
          </p>
        </div>
      ) : null}
      <div className="button-row">
        <Link href="/portal/website/enquiries">First page</Link>
        {nextCursor ? (
          <Link className="button" href={"?cursor=" + nextCursor}>
            Older enquiries →
          </Link>
        ) : null}
      </div>
    </Workspace>
  );
}
