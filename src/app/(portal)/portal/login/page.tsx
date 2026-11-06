import Link from "next/link";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";
import { getFirebaseWebConfig } from "@/lib/firebase/config";
import { isFirebaseServerConfigured } from "@/lib/firebase/admin";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  const configured = Boolean(
    getFirebaseWebConfig() && isFirebaseServerConfigured(),
  );
  return (
    <div className="portal-card">
      <Brand />
      <p className="eyebrow">Ministry management</p>
      <h1>
        Welcome to
        <br />
        <em>the leadership portal.</em>
      </h1>
      {configured ? (
        <>
          <LoginForm />
          <p className="content-note">
            Have a President or COO invitation?{" "}
            <Link href="/portal/join" className="text-link">
              Create your leadership account
            </Link>
          </p>
        </>
      ) : (
        <>
          <p>
            Staff sign-in is being connected to the ministry’s Firebase project.
          </p>
          <div className="portal-status">Authentication is not connected</div>
          <p className="content-note">
            No credentials are collected until Firebase configuration is
            complete.
          </p>
        </>
      )}
      <Link href="/" className="text-link auth-home-link">
        Return to the website <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
