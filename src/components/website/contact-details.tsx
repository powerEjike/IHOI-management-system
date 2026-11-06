import Link from "next/link";
import { formConfig, formsReady } from "@/lib/website/submissions";
import { EnquiryForm } from "./enquiry-form";
import type { SubmissionKind } from "@/lib/website/submission-model";
export async function PublicEnquiries({ kind }: { kind: SubmissionKind }) {
  const config = await formConfig();
  return (
    <section className="public-contact-block">
      {kind === "contact" ? (
        <div className="contact-details">
          <p className="eyebrow">Let’s connect</p>
          <h2>There is room for a conversation.</h2>
          {config?.email ? (
            <p>
              <span>Email</span>
              <a href={"mailto:" + config.email}>{config.email}</a>
            </p>
          ) : null}
          {config?.phone ? (
            <p>
              <span>Phone</span>
              <a href={"tel:" + config.phone.replace(/[^+0-9]/g, "")}>
                {config.phone}
              </a>
            </p>
          ) : null}
          {config?.address ? (
            <p>
              <span>Visit</span>
              {config.address}
            </p>
          ) : null}
          {config?.serviceTimes ? (
            <p style={{ whiteSpace: "pre-wrap" }}>
              <span>Gather with us</span>
              {config.serviceTimes}
            </p>
          ) : null}
          {config && !config.email && !config.phone && !config.address ? (
            <p>Ministry contact details will be shared here soon.</p>
          ) : null}
          <div className="social-links">
            {(["facebook", "instagram", "youtube"] as const).map((key) =>
              config?.[key] ? (
                <a
                  key={key}
                  href={config[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {key[0].toUpperCase() + key.slice(1)} ↗
                </a>
              ) : null,
            )}
          </div>
        </div>
      ) : null}
      {config?.formsEnabled === "yes" && formsReady() ? (
        <EnquiryForm kind={kind} />
      ) : (
        <div className="enquiry-holding">
          <p className="eyebrow">Stay connected</p>
          <h2>
            {kind === "volunteer"
              ? "Your gifts can make a difference."
              : kind === "partnership"
                ? "A shared purpose begins here."
                : "We look forward to hearing from you."}
          </h2>
          <p>
            {kind === "volunteer"
              ? "Volunteer applications will open here when the ministry is ready to welcome new expressions of interest."
              : "Online enquiries will open here soon. Thank you for your interest in the ministry."}
          </p>
          <Link
            className="text-link"
            href={kind === "contact" ? "/about" : "/contact"}
          >
            {kind === "contact"
              ? "Discover the ministry"
              : "Ministry contact information"}{" "}
            →
          </Link>
        </div>
      )}
    </section>
  );
}
