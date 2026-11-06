import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireStaff } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/policy";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const staff = await requireStaff();
  return (
    <div className="portal-card">
      <Brand />
      <p className="eyebrow">Staff workspace</p>
      <h1>
        Welcome,
        <br />
        <em>{staff.displayName}.</em>
      </h1>
      <p>Signed in as {staff.email}</p>
      <div className="role-badges">
        {staff.roles.map((role) => (
          <span key={role}>{roleLabels[role]}</span>
        ))}
      </div>
      <div className="portal-status">Your staff access is active.</div>
      <p className="content-note">
        Ministry modules are being built. No demonstration figures or private
        ministry records are shown here.
      </p>
      <SignOutButton />
    </div>
  );
}
