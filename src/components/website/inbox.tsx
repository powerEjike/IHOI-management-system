"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
import { useHydrated } from "@/lib/use-hydrated";
export function ReviewEnquiry({
  id,
  status,
  revision,
}: {
  id: string;
  status: string;
  revision: number;
}) {
  const ready = useHydrated(),
    router = useRouter();
  const [value, setValue] = useState(status),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      method="post"
      className="record-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await postJson("/api/website/enquiries", {
            id,
            status: value,
            expectedRevision: revision,
          });
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unable to review.");
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={!ready || busy}>
        <label>
          Review status
          <select value={value} onChange={(e) => setValue(e.target.value)}>
            {[
              "new",
              "safeguarding review",
              "in progress",
              "resolved",
              "spam",
              "archived",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="button button-outline" type="submit">
          {busy ? "Saving…" : "Save review"}
        </button>
      </fieldset>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
