import { requireStaff } from "@/lib/auth/session";
import { leadershipAccounts } from "@/lib/leadership/service";
import { roleLabels } from "@/lib/auth/policy";
import { Workspace } from "@/components/portal/workspace";
import { InviteForm } from "@/components/leadership/invite-form";
export const dynamic = "force-dynamic";
export default async function AccountsPage() {
  const staff = await requireStaff(["super_admin"]);
  const accounts = await leadershipAccounts();
  return (
    <Workspace
      staff={staff}
      title="Leadership accounts"
      eyebrow="Super Admin control"
    >
      <div className="leadership-grid">
        {accounts.map((account) => (
          <article key={account.role} className="workspace-panel">
            <p className="eyebrow">{roleLabels[account.role]}</p>
            <h2>{account.displayName}</h2>
            <p>
              {account.email || "Invite this leader to create their account."}
            </p>
            <span className="record-badge">{account.state}</span>
          </article>
        ))}
      </div>
      <InviteForm />
    </Workspace>
  );
}
