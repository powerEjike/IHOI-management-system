"use client";
import Link from "next/link";
import { ContentText } from "./content-text";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
import { useHydrated } from "@/lib/use-hydrated";
import type { PageCopy } from "@/lib/website/model";
type EditorData = {
  slug: string;
  version: number;
  draft: PageCopy;
  publishedVersion: number | null;
  status: string;
  history: { version: number; action: string; at: string; copy: PageCopy }[];
};
export function PageEditor({ data }: { data: EditorData }) {
  const router = useRouter(),
    hydrated = useHydrated();
  const [copy, setCopy] = useState(data.draft),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false);
  const dirty = JSON.stringify(copy) !== JSON.stringify(data.draft);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
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
        !window.confirm("Leave this page and discard your unsaved changes?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", beforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", beforeLink, true);
    };
  }, [dirty]);
  async function change(action: string, restoreVersion?: number) {
    if (busy) return;
    if (action !== "save" && dirty) {
      setError(
        "Save your changes before changing publication or restoring a revision.",
      );
      return;
    }
    if (
      action !== "save" &&
      !window.confirm(
        action === "publish"
          ? "Publish this saved draft on the public website?"
          : "Apply " + action + " to this page?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await postJson("/api/website", {
        slug: data.slug,
        expectedVersion: data.version,
        requestId: crypto.randomUUID(),
        action,
        ...(action === "save" ? { copy } : {}),
        ...(restoreVersion ? { restoreVersion } : {}),
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      setBusy(false);
    }
  }
  return (
    <>
      <div className="workspace-panel">
        <Link href="/portal/website">← All pages</Link>
        <p>
          State: <strong>{data.status}</strong> · Saved version {data.version} ·{" "}
          {data.publishedVersion
            ? "Public version " + data.publishedVersion
            : "No published copy"}
        </p>
        <p>
          Draft edits stay private. Publish uses the saved draft. Unpublish or
          archive removes the published copy and shows the public holding
          message.
        </p>
        <Link
          href={data.slug === "home" ? "/" : "/" + data.slug}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open public page ↗
        </Link>
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
          <legend>Page copy</legend>
          {(["title", "description", "heading", "body"] as const).map(
            (field) => (
              <label key={field}>
                {
                  {
                    title: "Page title",
                    description: "Page summary and search description",
                    heading: "Main section heading",
                    body: "Main text",
                  }[field]
                }
                <textarea
                  name={field}
                  rows={field === "body" ? 12 : 2}
                  required
                  maxLength={
                    { title: 140, description: 320, heading: 160, body: 6000 }[
                      field
                    ]
                  }
                  value={copy[field]}
                  onChange={(e) =>
                    setCopy({ ...copy, [field]: e.target.value })
                  }
                />
              </label>
            ),
          )}
          <p className="field-hint">
            Text supports paragraphs, **bold**, ## headings, - lists and
            [labels](https://example.com). Do not include private convert
            details or information awaiting permission.
          </p>
          <div className="button-row">
            <button className="button" type="submit">
              {busy ? "Saving…" : "Save draft"}
            </button>
            <button
              className="button button-ghost"
              type="button"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Hide preview" : "Preview draft"}
            </button>
          </div>
        </fieldset>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {dirty ? <p role="status">You have unsaved changes.</p> : null}
      </form>
      {preview ? (
        <article
          className="workspace-panel website-preview"
          aria-label="Private draft preview"
        >
          <p className="eyebrow">Private draft preview</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <h2>{copy.heading}</h2>
          <ContentText text={copy.body} />
        </article>
      ) : null}
      <section className="workspace-panel">
        <h2>Publication</h2>
        <div className="button-row">
          {["publish", "unpublish", "archive"].map((action) => (
            <button
              key={action}
              className="button button-ghost"
              disabled={
                !hydrated ||
                busy ||
                dirty ||
                !data.version ||
                (action === "publish" && data.status === "archived")
              }
              onClick={() => void change(action)}
            >
              {action === "publish"
                ? "Publish saved draft"
                : action === "unpublish"
                  ? "Unpublish"
                  : "Archive page"}
            </button>
          ))}
        </div>
      </section>
      <section className="workspace-panel">
        <h2>Recent revisions</h2>
        <p>
          Latest 20 changes. Restoring creates a new draft; it does not
          republish.
        </p>
        {data.history.length ? (
          data.history.map((item) => (
            <details key={item.version}>
              <summary>
                Version {item.version} · {item.action} ·{" "}
                {new Date(item.at).toLocaleString("en-GB", {
                  timeZone: "Africa/Lagos",
                })}
              </summary>
              <h3>{item.copy.title}</h3>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {item.copy.body}
              </p>
              <button
                className="button button-ghost"
                disabled={busy || !hydrated || dirty}
                onClick={() => void change("restore", item.version)}
              >
                Restore version {item.version} as draft
              </button>
            </details>
          ))
        ) : (
          <p>No revisions yet. Save your first draft.</p>
        )}
      </section>
    </>
  );
}
