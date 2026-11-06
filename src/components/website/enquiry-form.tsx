"use client";
import Link from "next/link";
import { useState } from "react";
import { postJson } from "@/lib/client-api";
import { useHydrated } from "@/lib/use-hydrated";
import type { SubmissionKind } from "@/lib/website/submission-model";
export function EnquiryForm({ kind }: { kind: SubmissionKind }) {
  const hydrated = useHydrated();
  const [startedAt] = useState(() => Date.now()),
    [requestId] = useState(() => crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  return sent ? (
    <section className="enquiry-success" role="status">
      <p className="eyebrow">Enquiry received</p>
      <h2>Thank you for reaching out.</h2>
      <p>
        Your message is saved for the ministry leadership to review. A response
        is not automatic.
      </p>
      <Link className="text-link" href="/">
        Return to the ministry homepage →
      </Link>
    </section>
  ) : (
    <form
      method="post"
      className="public-enquiry"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await postJson("/api/enquiries", {
            kind,
            startedAt,
            requestId,
            website: form.get("website"),
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            message: form.get("message"),
            interest: form.get("interest") || "",
            availability: form.get("availability") || "",
            adult: form.get("adult") === "yes",
            consent: form.get("consent") === "on",
          });
          setSent(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Please try again.");
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={!hydrated || busy}>
        <legend>
          {kind === "volunteer"
            ? "Offer your time and gifts"
            : kind === "partnership"
              ? "Start a partnership conversation"
              : "Send the ministry a message"}
        </legend>
        <p>
          Please share only what is needed for this enquiry. Avoid financial,
          health, safeguarding, or other sensitive details.
        </p>
        <div className="form-pair">
          <label>
            Your name *
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Email address *
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={160}
            />
          </label>
        </div>
        <label>
          Phone (optional)
          <input name="phone" type="tel" autoComplete="tel" maxLength={60} />
        </label>
        {kind === "partnership" ? (
          <label>
            How would you like to partner? *
            <select name="interest">
              {["Pray", "Give", "Volunteer", "Go"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ) : null}
        {kind === "volunteer" ? (
          <>
            <label>
              Skills or area of interest *
              <input name="interest" required maxLength={160} />
            </label>
            <label>
              Your availability *
              <textarea name="availability" required maxLength={500} rows={3} />
            </label>
            <label>
              Age declaration *
              <select name="adult" required defaultValue="">
                <option value="" disabled>
                  Choose your age group
                </option>
                <option value="yes">I am 18 or older</option>
                <option value="no">I am under 18</option>
              </select>
            </label>
            <p className="field-hint">
              Applicants under 18 remain in review pending the ministry’s
              safeguarding process. An enquiry does not approve or activate a
              volunteer role.
            </p>
          </>
        ) : null}
        <label>
          {kind === "volunteer"
            ? "Tell us why you would like to serve"
            : "Your message"}{" "}
          *
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={3000}
            rows={6}
          />
        </label>
        <div className="form-trap" aria-hidden="true">
          <label>
            Leave this field blank
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="checkbox-label">
          <input name="consent" required type="checkbox" />
          <span>
            I have read the{" "}
            <Link href="/privacy" target="_blank">
              privacy notice
            </Link>{" "}
            and agree that ministry leadership may use these details to review
            and respond to this enquiry.
          </span>
        </label>
        <button type="submit" className="button">
          {busy ? "Sending…" : "Send enquiry"}
        </button>
      </fieldset>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
