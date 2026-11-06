"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
import { useHydrated } from "@/lib/use-hydrated";
import { LibraryImage } from "./library-image";
import type { MediaInfo } from "@/lib/website/media";
export function MediaLibrary({ media }: { media: MediaInfo[] }) {
  const hydrated = useHydrated(),
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function approve(m: MediaInfo) {
    const source = window.prompt(
      "Publication permission source / reference (at least 5 characters)",
    );
    if (!source) return;
    const permissionDate = window.prompt(
      "Permission date (YYYY-MM-DD)",
      new Date().toISOString().slice(0, 10),
    );
    if (!permissionDate) return;
    const guardianConsent = m.containsMinors
      ? window.confirm(
          "Is guardian publication consent recorded for every identifiable minor?",
        )
      : false;
    setBusy(true);
    setError("");
    try {
      await postJson(
        "/api/website/media",
        {
          action: "approve",
          id: m.id,
          alt: m.alt,
          source,
          permissionDate,
          permission: "granted",
          containsMinors: m.containsMinors,
          guardianConsent,
        },
        "PATCH",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record approval.");
    } finally {
      setBusy(false);
    }
  }
  async function withdraw(id: string) {
    const reason = window.prompt(
      "Reason for withdrawing publication permission (at least 5 characters)",
    );
    if (!reason) return;
    setBusy(true);
    setError("");
    try {
      await postJson("/api/website/media", { id, reason }, "PATCH");
      router.refresh();
      setBusy(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to withdraw.");
      setBusy(false);
    }
  }
  return (
    <>
      <form
        method="post"
        className="workspace-panel record-form website-editor"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const form = e.currentTarget,
            data = new FormData(form),
            file = data.get("photo");
          if (!(file instanceof File) || !file.size || file.size > 2000000) {
            setError("Choose a photo up to 2 MB.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            let binary = "";
            for (let i = 0; i < bytes.length; i += 8192)
              binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
            await postJson("/api/website/media", {
              data: btoa(binary),
              alt: data.get("alt"),
              source: data.get("source"),
              permissionDate: data.get("permissionDate"),
              permission: data.get("permission"),
              containsMinors: data.get("containsMinors") === "on",
              guardianConsent: data.get("guardianConsent") === "on",
            });
            form.reset();
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={!hydrated || busy}>
          <legend>Add a ministry photograph</legend>
          <p>
            Still JPEG, PNG or WebP up to 2 MB and 16 megapixels. Photos are
            optimized and location metadata removed. Images stay private until
            used in published content with permission.
          </p>
          <label>
            Photo
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label>
            Accessible photo description
            <input name="alt" required maxLength={200} />
          </label>
          <label>
            Permission status
            <select name="permission">
              <option value="pending">Pending permission (private only)</option>
              <option value="granted">
                Permission granted for public website
              </option>
            </select>
          </label>
          <label>
            Permission source / reference
            <input name="source" minLength={5} maxLength={300} required />
          </label>
          <label>
            Permission / review date
            <input name="permissionDate" type="date" required />
          </label>
          <label className="checkbox-label">
            <input name="containsMinors" type="checkbox" />
            Identifiable minors appear
          </label>
          <label className="checkbox-label">
            <input name="guardianConsent" type="checkbox" />
            Guardian publication consent is recorded
          </label>
          <button className="button" type="submit">
            {busy ? "Uploading…" : "Upload photo"}
          </button>
        </fieldset>
      </form>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      <div className="media-library">
        {media.map((m) => (
          <article className="workspace-panel" key={m.id}>
            {m.withdrawn ? (
              <p>Permission withdrawn · Photo unavailable</p>
            ) : (
              <LibraryImage id={m.id} alt={m.alt} />
            )}
            <h2>{m.alt}</h2>
            <p>
              {m.withdrawn ? "Withdrawn" : m.permission} ·{" "}
              {Math.ceil(m.bytes / 1024)} KB
            </p>
            <p>
              Source: {m.source} · {m.permissionDate}
            </p>
            {!m.withdrawn && m.permission === "pending" ? (
              <button
                className="button button-outline"
                disabled={busy || !hydrated}
                onClick={() => void approve(m)}
              >
                Record publication approval
              </button>
            ) : null}
            {!m.withdrawn ? (
              <button
                className="button button-outline"
                disabled={busy || !hydrated}
                onClick={() => void withdraw(m.id)}
              >
                Withdraw permission
              </button>
            ) : null}
          </article>
        ))}
      </div>
      {!media.length ? (
        <p className="workspace-panel">
          Your photo library is ready. Upload approved ministry photographs when
          available.
        </p>
      ) : null}
    </>
  );
}
