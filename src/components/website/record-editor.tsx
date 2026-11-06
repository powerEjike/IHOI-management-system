"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { postJson } from "@/lib/client-api";
import {
  fieldsFor,
  catalogues,
  type ContentKind,
  imageIds,
} from "@/lib/website/schema";
import type { WebRecord } from "@/lib/website/records";
import type { MediaInfo } from "@/lib/website/media";
import { ContentText } from "./content-text";
import { LibraryImage } from "./library-image";
export function RecordEditor({
  record,
  history,
  media,
}: {
  record: WebRecord;
  history: { version: number; action: string; at: string }[];
  media: MediaInfo[];
}) {
  const hydrated = useHydrated(),
    router = useRouter();
  const [fields, setFields] = useState(record.draft),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(record.draft);
  useUnsavedChanges(dirty);
  const kind: ContentKind = record.kind;
  async function change(action: string, restoreVersion?: number) {
    if (busy) return;
    if (action !== "save" && dirty) {
      setError("Save your changes first.");
      return;
    }
    if (
      action !== "save" &&
      !window.confirm(
        action === "publish"
          ? "Publish this saved version for everyone to see?"
          : "Apply " + action + "?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await postJson("/api/website/records", {
        kind,
        id: record.id,
        expectedVersion: record.version,
        requestId: crypto.randomUUID(),
        action,
        ...(action === "save" ? { fields } : {}),
        ...(restoreVersion ? { restoreVersion } : {}),
      });
      router.refresh();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Unable to save.");
    }
  }
  return (
    <>
      <div className="workspace-panel">
        <Link href="/portal/website">← Website desk</Link>
        <p>
          <strong>{record.status}</strong> · Saved version {record.version} ·{" "}
          {record.publishedVersion
            ? "Public version " + record.publishedVersion
            : "Not public"}
        </p>
        <p>
          Save and preview before publishing. Restoring history creates a draft.
          Publishing requires a recorded approval.
        </p>
        {kind !== "settings" && record.publishedVersion ? (
          <Link
            target="_blank"
            href={"/" + catalogues[kind].path + "/" + record.id}
          >
            View public {catalogues[kind].singular.toLowerCase()} ↗
          </Link>
        ) : null}
      </div>
      <form
        method="post"
        className="record-form workspace-panel website-editor"
        onSubmit={(e) => {
          e.preventDefault();
          void change("save");
        }}
      >
        <fieldset disabled={busy || !hydrated}>
          <legend>
            {kind === "settings"
              ? "Website settings"
              : catalogues[kind].singular + " details"}
          </legend>
          {fieldsFor(kind).map((f) =>
            f.type === "images" ? (
              <div key={f.name}>
                <p className="field-label">
                  {f.label} ·{" "}
                  {fields.images?.split(",").filter(Boolean).length || 0} / 12
                  selected
                </p>
                <p className="field-hint">
                  Upload photos in the media library first. Pending permission
                  photos cannot be published.
                </p>
                <div className="media-picker">
                  {media
                    .filter((m) => !m.withdrawn)
                    .map((m) => (
                      <label key={m.id}>
                        <LibraryImage id={m.id} alt={m.alt} />
                        <span>
                          <input
                            type="checkbox"
                            disabled={
                              !(fields.images || "")
                                .split(",")
                                .includes(m.id) &&
                              (fields.images || "").split(",").filter(Boolean)
                                .length >= 12
                            }
                            checked={(fields.images || "")
                              .split(",")
                              .includes(m.id)}
                            onChange={(e) => {
                              const selected = (fields.images || "")
                                .split(",")
                                .filter(Boolean);
                              setFields({
                                ...fields,
                                images: (e.target.checked
                                  ? [...selected, m.id]
                                  : selected.filter((v) => v !== m.id)
                                ).join(","),
                              });
                            }}
                          />
                          {m.alt} · {m.permission}
                        </span>
                      </label>
                    ))}
                </div>
                {!media.length ? (
                  <Link href="/portal/website/media">Open media library →</Link>
                ) : null}
              </div>
            ) : (
              <label key={f.name}>
                {f.label}
                {f.required ? " *" : ""}
                {f.type === "select" ? (
                  <select
                    name={f.name}
                    value={fields[f.name] || f.options![0]}
                    onChange={(e) =>
                      setFields({ ...fields, [f.name]: e.target.value })
                    }
                  >
                    {f.options!.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    name={f.name}
                    required={f.required}
                    maxLength={f.max || 1000}
                    rows={8}
                    value={fields[f.name] || ""}
                    onChange={(e) =>
                      setFields({ ...fields, [f.name]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    name={f.name}
                    type={f.type || "text"}
                    min={f.type === "number" ? 0 : undefined}
                    max={f.type === "number" ? 100 : undefined}
                    required={f.required}
                    maxLength={f.max || 1000}
                    value={fields[f.name] || ""}
                    onChange={(e) =>
                      setFields({ ...fields, [f.name]: e.target.value })
                    }
                  />
                )}
              </label>
            ),
          )}
          <p className="field-hint">
            Text supports paragraphs, **bold**, ## headings, - lists, and [link
            labels](https://example.com). HTML is not allowed. Dates and times
            use Africa/Lagos (UTC+1).
          </p>
          <div className="button-row">
            <button className="button" type="submit">
              {busy ? "Saving…" : "Save draft"}
            </button>
            <button
              className="button button-outline"
              type="button"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Hide preview" : "Preview draft"}
            </button>
          </div>
        </fieldset>
        {dirty ? <p role="status">Unsaved changes</p> : null}
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
      </form>
      {preview ? (
        <article
          aria-label="Private content preview"
          className="workspace-panel website-preview"
        >
          <p className="eyebrow">Private preview</p>
          <h2>{fields.title}</h2>
          <p>{fields.summary}</p>
          {fields.body ? <ContentText text={fields.body} /> : null}
          {fields.privacyNotice ? (
            <ContentText text={fields.privacyNotice} />
          ) : null}
          <div className="photo-grid">
            {imageIds(fields.images || "").map((id) => (
              <LibraryImage
                key={id}
                id={id}
                alt={media.find((m) => m.id === id)?.alt || fields.title}
              />
            ))}
          </div>
        </article>
      ) : null}
      <section className="workspace-panel">
        <h2>Publication</h2>
        <div className="button-row">
          {["publish", "unpublish", "archive"].map((action) => (
            <button
              className="button button-outline"
              key={action}
              disabled={
                busy ||
                !hydrated ||
                dirty ||
                !record.version ||
                (action === "publish" && record.status === "archived")
              }
              onClick={() => void change(action)}
            >
              {action === "publish"
                ? "Publish saved draft"
                : action === "unpublish"
                  ? "Unpublish"
                  : "Archive"}
            </button>
          ))}
        </div>
      </section>
      <section className="workspace-panel">
        <h2>Revision history</h2>
        <p>Latest 20 changes. Restoring never republishes automatically.</p>
        {history.map((r) => (
          <div className="revision-row" key={r.version}>
            <span>
              Version {r.version} · {r.action} ·{" "}
              {new Date(r.at).toLocaleString("en-GB", {
                timeZone: "Africa/Lagos",
              })}
            </span>
            <button
              className="button button-outline"
              disabled={!hydrated || busy || dirty}
              onClick={() => void change("restore", r.version)}
            >
              Restore version {r.version}
            </button>
          </div>
        ))}
        {!history.length ? (
          <p>Save your first draft to start the history.</p>
        ) : null}
      </section>
    </>
  );
}
