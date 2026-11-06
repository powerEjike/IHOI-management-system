"use client";
import { useHydrated } from "@/lib/use-hydrated";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
export function ArchiveForm({
  id,
  archived,
  revision,
}: {
  id: string;
  archived: boolean;
  revision: number;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  return (
    <div className="archive-control">
      {open ? (
        <form
          method="post"
          className="record-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const form = new FormData(event.currentTarget);
            setBusy(true);
            setError("");
            try {
              await postJson(`/api/converts/${id}/archive`, {
                requestId,
                expectedRevision: revision,
                archived: !archived,
                reason: form.get("reason"),
              });
              router.refresh();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Unable to change this record.",
              );
              setBusy(false);
            }
          }}
        >
          <label>
            {archived ? "Reason for restoring" : "Reason for archiving"}
            <textarea
              name="reason"
              required
              minLength={5}
              maxLength={500}
              rows={2}
            />
          </label>
          <p className="field-hint">
            History is retained. Archiving removes this record from active
            lists.
          </p>
          {error ? (
            <p role="alert" className="form-error">
              {error}
            </p>
          ) : null}
          <div className="button-row">
            <button
              className="button"
              type="submit"
              disabled={busy || !hydrated}
            >
              {busy
                ? "Saving…"
                : archived
                  ? "Confirm restore"
                  : "Confirm archive"}
            </button>
            <button
              type="button"
              className="button button-outline"
              disabled={busy || !hydrated}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="button button-outline"
          onClick={() => setOpen(true)}
        >
          {archived ? "Restore record" : "Archive record"}
        </button>
      )}
    </div>
  );
}
