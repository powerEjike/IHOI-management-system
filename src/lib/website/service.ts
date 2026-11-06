import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { FieldValue } from "firebase-admin/firestore";
import {
  getFirebaseAdmin,
  isFirebaseServerConfigured,
} from "@/lib/firebase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { parseStaffRecord } from "@/lib/auth/policy";
import { ApiError } from "@/lib/http";
import {
  initialCopy,
  pageSlug,
  validateCopy,
  expectedVersion,
  type PageCopy,
} from "./model";
export async function contentActor() {
  const actor = await getStaffSession();
  if (!actor) throw new ApiError(401, "unauthorized", "Please sign in again.");
  return actor;
}
export async function readEditor(slugValue: string) {
  await contentActor();
  const slug = pageSlug(slugValue);
  const ref = getFirebaseAdmin().db.collection("website_pages").doc(slug);
  const [snapshot, history] = await Promise.all([
    ref.get(),
    ref.collection("revisions").orderBy("version", "desc").limit(20).get(),
  ]);
  const d = snapshot.data();
  return {
    slug,
    version: d?.version || 0,
    draft: (d?.draft || initialCopy(slug)) as PageCopy,
    publishedVersion: (d?.publishedVersion || null) as number | null,
    status: (d?.status || "draft") as string,
    history: history.docs.map((r) => {
      const v = r.data();
      return {
        version: v.version as number,
        action: v.action as string,
        at: v.at.toDate().toISOString(),
        copy: v.copy as PageCopy,
      };
    }),
  };
}
export const publishedPage = cache(
  async (slugValue: string): Promise<PageCopy | null> => {
    const slug = pageSlug(slugValue);
    if (!isFirebaseServerConfigured()) return null;
    const doc = await getFirebaseAdmin()
      .db.collection("published_pages")
      .doc(slug)
      .get();
    return doc.exists ? validateCopy(doc.data()?.copy) : null;
  },
);
export async function changePage(raw: Record<string, unknown>) {
  const actor = await contentActor();
  const slug = pageSlug(raw.slug);
  const expected = expectedVersion(raw.expectedVersion);
  const action = raw.action;
  if (
    !["save", "publish", "unpublish", "archive", "restore"].includes(
      String(action),
    )
  )
    throw new ApiError(400, "invalid", "Choose a content action.");
  if (
    Object.keys(raw).some(
      (k) =>
        ![
          "slug",
          "expectedVersion",
          "requestId",
          "action",
          "copy",
          "restoreVersion",
        ].includes(k),
    )
  )
    throw new ApiError(400, "invalid", "Unsupported input fields.");
  if (
    typeof raw.requestId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(raw.requestId)
  )
    throw new ApiError(400, "invalid", "Provide a request ID.");
  const supplied = action === "save" ? validateCopy(raw.copy) : null;
  const restoreVersion =
    action === "restore" ? expectedVersion(raw.restoreVersion) : 0;
  const db = getFirebaseAdmin().db;
  const ref = db.collection("website_pages").doc(slug);
  const requestKey = createHash("sha256")
    .update(actor.uid + ":" + raw.requestId)
    .digest("hex");
  const op = ref.collection("operations").doc(requestKey);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ action, expected, supplied, restoreVersion }))
    .digest("hex");
  return db.runTransaction(async (tx) => {
    const [staff, slot, old, operation, restored] = await Promise.all([
      tx.get(db.collection("staff_access").doc(actor.uid)),
      tx.get(db.collection("leadership_accounts").doc(actor.roles[0])),
      tx.get(ref),
      tx.get(op),
      action === "restore"
        ? tx.get(ref.collection("revisions").doc(String(restoreVersion)))
        : Promise.resolve(null),
    ]);
    const approval = parseStaffRecord(staff.data());
    if (
      !approval?.active ||
      approval.roles[0] !== actor.roles[0] ||
      slot.data()?.uid !== actor.uid
    )
      throw new ApiError(
        403,
        "forbidden",
        "Your leadership access has changed.",
      );
    if (operation.exists) {
      if (operation.data()?.fingerprint !== fingerprint)
        throw new ApiError(
          409,
          "conflict",
          "This request ID has already been used.",
        );
      return { version: operation.data()!.version };
    }
    const previous = old.data();
    if ((previous?.version || 0) !== expected)
      throw new ApiError(
        409,
        "conflict",
        "Another leader changed this page. Your entries are preserved; open a fresh editor before saving.",
      );
    if (action === "publish" && !previous)
      throw new ApiError(400, "invalid", "Save a draft before publishing.");
    if (action === "publish" && previous?.status === "archived")
      throw new ApiError(
        400,
        "invalid",
        "Save or restore this archived page before publishing.",
      );
    if (action === "restore" && !restored?.exists)
      throw new ApiError(404, "not_found", "That revision is unavailable.");
    const copy = validateCopy(
      supplied ||
        (action === "restore" ? restored?.data()?.copy : previous?.draft) ||
        initialCopy(slug),
    );
    const version = expected + 1;
    const now = FieldValue.serverTimestamp();
    const hide = action === "archive" || action === "unpublish";
    const publishedVersion =
      action === "publish"
        ? version
        : hide
          ? null
          : previous?.publishedVersion || null;
    const status =
      action === "archive"
        ? "archived"
        : publishedVersion
          ? "published"
          : "draft";
    tx.set(ref, {
      draft: copy,
      version,
      publishedVersion,
      status,
      updatedAt: now,
      updatedBy: actor.uid,
    });
    tx.create(ref.collection("revisions").doc(String(version)), {
      version,
      action,
      copy,
      at: now,
      actorUid: actor.uid,
    });
    tx.create(op, { version, fingerprint });
    if (action === "publish")
      tx.set(db.collection("published_pages").doc(slug), {
        copy,
        version,
        publishedAt: now,
      });
    else if (hide) tx.delete(db.collection("published_pages").doc(slug));
    tx.create(db.collection("audit_logs").doc(), {
      type: "website_content",
      pageSlug: slug,
      action,
      version,
      actorUid: actor.uid,
      createdAt: now,
    });
    return { version };
  });
}
