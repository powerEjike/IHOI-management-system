import Link from "next/link";
import { Brand } from "@/components/brand";
import { JoinForm } from "@/components/leadership/join-form";
import { getFirebaseWebConfig } from "@/lib/firebase/config";
export const dynamic = "force-dynamic";
export default function JoinPage() {
  return (
    <div className="portal-card">
      <Brand />
      <p className="eyebrow">Invited leadership</p>
      <h1>
        Your ministry
        <br />
        <em>workspace awaits.</em>
      </h1>
      {getFirebaseWebConfig() ? (
        <JoinForm />
      ) : (
        <p>Account setup is awaiting Firebase configuration.</p>
      )}
      <Link className="text-link auth-home-link" href="/portal/login">
        Back to sign-in
      </Link>
    </div>
  );
}
