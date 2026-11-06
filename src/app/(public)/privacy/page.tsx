import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy & website status" };
export default function PrivacyPage() {
  return (
    <article className="container prose-page">
      <p className="eyebrow">Website preview</p>
      <h1>Privacy & website status</h1>
      <p>
        This is the initial website foundation for International House of
        Incense Ministries. Ministry copy is a draft pending approval; the
        supplied ministry logo is in use.
      </p>
      <h2>Public applications are not open yet</h2>
      <p>
        Contact, volunteer, and partnership forms are not active. Approved staff
        accounts use Firebase Authentication and server-managed access controls.
        Do not send private personal information through development channels.
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
