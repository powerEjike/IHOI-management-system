import Link from "next/link";
import { Brand } from "@/components/brand";
export default function PortalPage() {
  return (
    <div className="portal-card">
      <Brand />
      <p className="eyebrow">Ministry management</p>
      <h1>
        A dedicated space
        <br />
        <em>for the work ahead.</em>
      </h1>
      <p>
        Staff access is not available yet. Secure sign-in and role-based access
        will be introduced in the next implementation stage.
      </p>
      <div className="portal-status">
        <span aria-hidden="true">◌</span> Authentication is not connected
      </div>
      <p className="content-note">
        No private records are stored or displayed in this preview.
      </p>
      <Link href="/" className="button">
        Return to the website <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
