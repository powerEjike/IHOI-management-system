import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { roleLabels, type StaffRole } from "@/lib/auth/policy";
type Leader = { displayName: string; email: string; roles: StaffRole[] };
export function Workspace({
  staff,
  title,
  eyebrow = "Ministry operations",
  children,
}: {
  staff: Leader;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Brand />
        <p className="workspace-label">Leadership workspace</p>
        <nav aria-label="Administration">
          <Link href="/portal/dashboard">
            Overview <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/portal/converts">
            Converts <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/portal/website">
            Website content <span aria-hidden="true">↗</span>
          </Link>
          {staff.roles[0] === "super_admin" ? (
            <Link href="/portal/accounts">
              Leadership accounts <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
          <Link href="/">
            Public website <span aria-hidden="true">↗</span>
          </Link>
        </nav>
        <div className="workspace-identity">
          <strong>{staff.displayName}</strong>
          <span>{roleLabels[staff.roles[0]]}</span>
          <SignOutButton />
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>International House of Incense Ministries</p>
        </header>
        {children}
        <footer className="workspace-footer">
          Private ministry workspace · Access for Super Admin, President, and
          COO
        </footer>
      </div>
    </div>
  );
}
