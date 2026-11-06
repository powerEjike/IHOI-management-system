import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy & website status" };
export default function PrivacyPage() {
  return (
    <article className="container prose-page">
      <p className="eyebrow">Website preview</p>
      <h1>Privacy & website status</h1>
      <p>
        This is the initial website foundation for International House of
        Incense. Ministry copy and branding are drafts pending approval.
      </p>
      <h2>No applications or private records yet</h2>
      <p>
        Contact, volunteer, and partnership forms are not active. There is no
        staff sign-in or connected ministry database in this version. Do not
        send private personal information through development channels.
      </p>
      <h2>Technical operation</h2>
      <p>
        No analytics or marketing tools are installed in this application. A
        hosting provider may process ordinary request information when serving
        the website.
      </p>
      <h2>Before public launch</h2>
      <p>
        The ministry will publish approved contact details and a full privacy
        notice before collecting applications or enquiries. Search indexing is
        currently disabled.
      </p>
    </article>
  );
}
