import type { Metadata } from "next";
import { formConfig } from "@/lib/website/submissions";
import { ContentText } from "@/components/website/content-text";
export const metadata: Metadata = { title: "Privacy" };
export const dynamic = "force-dynamic";
export default async function PrivacyPage() {
  const settings = await formConfig();
  return (
    <article className="container prose-page">
      <p className="eyebrow">Your information matters</p>
      <h1>Privacy & your information</h1>
      {settings?.privacyNotice ? (
        <ContentText text={settings.privacyNotice} />
      ) : (
        <>
          <h2>Preparing to welcome you</h2>
          <p>
            The ministry is preparing its approved contact information and
            privacy notice. Public enquiry forms remain closed until these are
            ready.
          </p>
        </>
      )}
      <h2>Website operation</h2>
      <p>
        This website does not use advertising or analytics cookies. Leadership
        sign-in uses essential authentication cookies. Loading an external video
        or opening an external resource connects you to that provider.
      </p>
      <h2>Ministry enquiries</h2>
      <p>
        When forms are open, only the ministry leadership can review your
        enquiry. An enquiry does not create a public profile or a portal
        account. Please avoid including sensitive personal information.
      </p>
      {settings?.email ? (
        <p>
          For privacy questions or requests, contact{" "}
          <a href={"mailto:" + settings.email}>{settings.email}</a>.
        </p>
      ) : null}
    </article>
  );
}
