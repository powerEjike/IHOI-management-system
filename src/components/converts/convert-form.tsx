"use client";
import { useHydrated } from "@/lib/use-hydrated";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientApiError, postJson } from "@/lib/client-api";
import {
  ministryToday,
  type ConvertInput,
  type ConvertRecord,
  type Duplicate,
} from "@/lib/converts/model";

export function ConvertForm({
  record,
  requestId,
}: {
  record?: ConvertRecord;
  requestId: string;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({}),
    [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [permission, setPermission] = useState(
    record?.contactPermission || "unknown",
  );
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const beforeLink = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        target instanceof HTMLAnchorElement &&
        target.target !== "_blank" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !window.confirm("Leave this page and discard your unsaved entries?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeLink, true);
    };
  }, [dirty]);
  const hint = (name: string) =>
    fields[name] ? (
      <span className="field-error" id={`${name}-error`}>
        {fields[name]}
      </span>
    ) : null;
  const invalid = (name: string) => ({
    "aria-invalid": Boolean(fields[name]),
    "aria-describedby": fields[name] ? `${name}-error` : undefined,
  });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setFields({});
    const form = new FormData(event.currentTarget);
    const input: Record<string, string> = {};
    for (const key of [
      "fullName",
      "phone",
      "email",
      "location",
      "registeredDate",
      "stage",
      "contactPermission",
      "consentSource",
      "consentDate",
      "noContactReason",
      "assignedLeaderRole",
      "notes",
    ])
      input[key] = String(form.get(key) || "");
    try {
      const result = await postJson<{ id: string }>(
        record ? `/api/converts/${record.id}` : "/api/converts",
        {
          input: input as ConvertInput,
          requestId,
          expectedRevision: record?.revision,
          reason: String(form.get("reason") || ""),
          duplicateReason: String(form.get("duplicateReason") || ""),
        },
        record ? "PATCH" : "POST",
      );
      setDirty(false);
      router.push(`/portal/converts/${result.id}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save. Your entries are still here.",
      );
      if (error instanceof ClientApiError && error.code === "duplicate")
        setDuplicates(error.details as Duplicate[]);
      else if (
        error instanceof ClientApiError &&
        error.details &&
        !Array.isArray(error.details)
      )
        setFields(error.details as Record<string, string>);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      method="post"
      className="record-form workspace-panel"
      onSubmit={submit}
      onChange={() => setDirty(true)}
    >
      <p className="form-introduction">
        Enter records manually. Keep notes relevant to ministry care. Fields
        marked * are required.
      </p>
      <fieldset disabled={busy || !hydrated}>
        <legend>Personal details</legend>
        <div className="form-grid">
          <label className="form-wide">
            Full name *
            <input
              name="fullName"
              defaultValue={record?.fullName}
              maxLength={120}
              required
              autoComplete="off"
              {...invalid("fullName")}
            />
            {hint("fullName")}
          </label>
          <label>
            Phone
            <input
              name="phone"
              type="tel"
              defaultValue={record?.phone}
              maxLength={30}
              placeholder="Include country code where available"
              {...invalid("phone")}
            />
            {hint("phone")}
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              defaultValue={record?.email}
              maxLength={254}
              {...invalid("email")}
            />
            {hint("email")}
          </label>
          <label className="form-wide">
            If no contact details are available, explain why
            <textarea
              name="noContactReason"
              defaultValue={record?.noContactReason}
              maxLength={300}
              rows={2}
              {...invalid("noContactReason")}
            />
            {hint("noContactReason")}
          </label>
          <label>
            Location
            <input
              name="location"
              defaultValue={record?.location}
              maxLength={160}
              {...invalid("location")}
            />
            {hint("location")}
          </label>
          <label>
            Registration date *
            <input
              name="registeredDate"
              type="date"
              defaultValue={record?.registeredDate || ministryToday()}
              max={ministryToday()}
              required
              {...invalid("registeredDate")}
            />
            {hint("registeredDate")}
          </label>
        </div>
      </fieldset>
      <fieldset disabled={busy || !hydrated}>
        <legend>Ministry and follow-up</legend>
        <div className="form-grid">
          <label>
            Ministry stage *
            <select
              name="stage"
              defaultValue={record?.stage || "convert"}
              {...invalid("stage")}
            >
              <option value="convert">Convert</option>
              <option value="disciple">Disciple</option>
              <option value="worker">Worker</option>
            </select>
            <span className="field-hint">
              A ministry stage never creates a login account.
            </span>
            {hint("stage")}
          </label>
          <label>
            Follow-up lead
            <select
              name="assignedLeaderRole"
              defaultValue={record?.assignedLeaderRole || ""}
              {...invalid("assignedLeaderRole")}
            >
              <option value="">Unassigned</option>
              <option value="super_admin">Super Admin</option>
              <option value="president">President</option>
              <option value="coo">COO</option>
            </select>
            <span className="field-hint">
              Only accounts that have completed setup can be assigned.
            </span>
            {hint("assignedLeaderRole")}
          </label>
          <label>
            Permission to contact *
            <select
              name="contactPermission"
              value={permission}
              onChange={(event) =>
                setPermission(event.target.value as typeof permission)
              }
              {...invalid("contactPermission")}
            >
              <option value="unknown">Unknown — review before contact</option>
              <option value="granted">Granted</option>
              <option value="declined">Declined — do not contact</option>
            </select>
            {hint("contactPermission")}
          </label>
          {permission !== "unknown" ? (
            <>
              <label>
                Permission date *
                <input
                  name="consentDate"
                  type="date"
                  defaultValue={record?.consentDate || ministryToday()}
                  max={ministryToday()}
                  required
                  {...invalid("consentDate")}
                />
                {hint("consentDate")}
              </label>
              <label className="form-wide">
                How was permission confirmed? *
                <input
                  name="consentSource"
                  defaultValue={record?.consentSource}
                  minLength={3}
                  maxLength={300}
                  required
                  {...invalid("consentSource")}
                />
                {hint("consentSource")}
              </label>
            </>
          ) : null}
          <label className="form-wide">
            Private ministry notes
            <textarea
              name="notes"
              defaultValue={record?.notes}
              rows={4}
              maxLength={3000}
              {...invalid("notes")}
            />
            {hint("notes")}
          </label>
          <label className="form-wide">
            Reason for changing the ministry stage
            <textarea name="reason" rows={2} maxLength={500} />
            <span className="field-hint">
              Required when changing the stage, including registering someone as
              a disciple or worker.
            </span>
          </label>
        </div>
      </fieldset>
      {duplicates.length ? (
        <div className="duplicate-review">
          <h2>Review possible existing records</h2>
          <p>
            Names or contact details may match. Open a record in a new tab to
            compare before proceeding.
          </p>
          <ul>
            {duplicates.map((item) => (
              <li key={item.id}>
                <Link
                  target="_blank"
                  rel="noopener"
                  href={`/portal/converts/${item.id}`}
                >
                  {item.fullName}
                </Link>
                {item.archived ? " (archived)" : ""}
              </li>
            ))}
          </ul>
          <label>
            Why is a separate record needed?
            <textarea
              name="duplicateReason"
              minLength={10}
              maxLength={500}
              rows={2}
              required
            />
          </label>
        </div>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {fields.form ? (
        <p className="form-error" role="alert">
          {fields.form}
        </p>
      ) : null}
      <div className="button-row">
        <button className="button" type="submit" disabled={busy || !hydrated}>
          {busy ? "Saving…" : record ? "Save changes" : "Register convert"}
        </button>
        <Link
          className="button button-outline"
          href={record ? `/portal/converts/${record.id}` : "/portal/converts"}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
