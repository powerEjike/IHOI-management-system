import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
export default async function ForbiddenPage() {
  await requireStaff();
  return (
    <div className="portal-card">
      <p className="eyebrow">Access restricted</p>
      <h1>
        This area requires
        <br />
        <em>another permission.</em>
      </h1>
      <p>
        Contact the ministry administrator if your responsibilities have
        changed.
      </p>
      <Link href="/portal/dashboard" className="button">
        Return to your workspace
      </Link>
    </div>
  );
}
