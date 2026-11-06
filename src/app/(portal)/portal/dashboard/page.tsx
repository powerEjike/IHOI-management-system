import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { convertStats } from "@/lib/converts/service";
import { Workspace } from "@/components/portal/workspace";
import { PreparingView } from "@/components/portal/preparing-view";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const staff = await requireStaff();
  let stats;
  try {
    stats = await convertStats();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 9
    )
      return (
        <Workspace staff={staff} title="Leadership overview">
          <PreparingView />
        </Workspace>
      );
    throw error;
  }
  const cards = [
    { label: "Active converts", count: stats.active, href: "/portal/converts" },
    {
      label: "Active registrations this month",
      count: stats.recent,
      href: "/portal/converts?recent=1",
    },
    {
      label: "No follow-up lead",
      count: stats.unassigned,
      href: "/portal/converts?lead=unassigned",
    },
    {
      label: "Active disciples",
      count: stats.disciples,
      href: "/portal/converts?stage=disciple",
    },
  ];
  return (
    <Workspace
      staff={staff}
      title={`Welcome, ${staff.displayName}.`}
      eyebrow="Leadership overview"
    >
      <div className="workspace-toolbar">
        <p>
          Live ministry records. Archived records are excluded from these
          figures.
        </p>
        <Link className="button" href="/portal/converts/new">
          Register convert ＋
        </Link>
      </div>
      <div className="metric-grid">
        {cards.map((card) => (
          <Link key={card.label} className="metric-card" href={card.href}>
            <span>{card.label}</span>
            <strong>{card.count}</strong>
            <small>View records ↗</small>
          </Link>
        ))}
      </div>
      <section className="workspace-panel">
        <p className="eyebrow">Start with people</p>
        <h2>A clear record. A responsible next step.</h2>
        <p>
          Register converts manually, review contact permission, and assign a
          leadership follow-up lead. A convert, disciple, worker, or volunteer
          record does not create a login account.
        </p>
        <Link href="/portal/converts" className="text-link">
          Open converts register ↗
        </Link>
      </section>
      <section className="workspace-panel">
        <h2>Website and ministry development</h2>
        <p>
          The public website remains available alongside this workspace.
          Outreach, detailed follow-up schedules, discipleship courses, and
          website content editing are the next implementation stages.
        </p>
        <Link href="/" className="text-link">
          View public website ↗
        </Link>
      </section>
    </Workspace>
  );
}
