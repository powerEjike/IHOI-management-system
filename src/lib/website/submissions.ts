import "server-only";
import { createHmac, createHash } from "node:crypto";
import { isIP } from "node:net";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { ContentError } from "./schema";
import { validateSubmission } from "./submission-model";
import { contentActor } from "./service";
import { checkContentActor, recordsRef, publicRecord } from "./records";
export async function formConfig() {
  const settings = await publicRecord("settings", "main");
  return settings?.fields || null;
}
export function formsReady() {
  return (
    (process.env.PUBLIC_FORM_RATE_LIMIT_SECRET || "").length >= 32 &&
    (process.env.NODE_ENV !== "production" ||
      Boolean(process.env.PUBLIC_FORM_PROXY_HEADER))
  );
}
export async function submitEnquiry(
  raw: Record<string, unknown>,
  headers: Headers,
) {
  if (raw.website) return { ok: true };
  const data = validateSubmission(raw);
  if (!formsReady())
    throw new ContentError(
      503,
      "Enquiries are not open yet. Please return later.",
    );
  const secret = process.env.PUBLIC_FORM_RATE_LIMIT_SECRET!;
  const configuredHeader = process.env.PUBLIC_FORM_PROXY_HEADER;
  const clientIp = configuredHeader
    ? headers.get(configuredHeader)?.split(",")[0].trim()
    : "";
  if (configuredHeader && (!clientIp || !isIP(clientIp)))
    throw new ContentError(
      503,
      "The enquiry service is temporarily unavailable.",
    );
  const day = new Date().toISOString().slice(0, 10);
  const key = createHmac("sha256", secret)
    .update(day + ":" + (clientIp || "local-preview"))
    .digest("hex");
  const id = createHash("sha256")
    .update(data.kind + ":" + data.requestId)
    .digest("hex");
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
  const db = getFirebaseAdmin().db,
    ref = db.collection("website_submissions").doc(id),
    limit = db.collection("website_form_limits").doc(key),
    globalLimit = db.collection("website_form_limits").doc("global-" + day);
  return db.runTransaction(async (tx) => {
    const [config, existing, rate, total] = await Promise.all([
      tx.get(recordsRef("settings", true).doc("main")),
      tx.get(ref),
      tx.get(limit),
      tx.get(globalLimit),
    ]);
    const settings = config.data()?.fields;
    if (
      !settings ||
      settings.formsEnabled !== "yes" ||
      !settings.email ||
      settings.privacyNotice?.length < 80
    )
      throw new ContentError(
        503,
        "Enquiries are not open yet. Please return later.",
      );
    if (existing.exists) {
      if (existing.data()?.fingerprint !== fingerprint)
        throw new ContentError(
          409,
          "Please submit this enquiry using a fresh form.",
        );
      return { ok: true };
    }
    const now = Date.now();
    for (const [doc, max] of [
      [rate, 5],
      [total, 60],
    ] as const) {
      const value = doc.data();
      if (value && now - value.windowStartedAt < 3600000 && value.count >= max)
        throw new ContentError(
          429,
          "Too many enquiries. Please try again in an hour.",
        );
    }
    for (const doc of [rate, total]) {
      const v = doc.data();
      tx.set(doc.ref, {
        windowStartedAt:
          v && now - v.windowStartedAt < 3600000 ? v.windowStartedAt : now,
        count: v && now - v.windowStartedAt < 3600000 ? v.count + 1 : 1,
        expiresAt: new Date(now + 86400000),
      });
    }
    tx.create(ref, {
      kind: data.kind,
      fields: data.fields,
      adult: data.adult,
      consent: true,
      privacyVersion: config.data()?.version,
      consentAt: FieldValue.serverTimestamp(),
      fingerprint,
      status:
        data.kind === "volunteer" && !data.adult
          ? "safeguarding review"
          : "new",
      revision: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  });
}
export async function enquiryInbox(cursor = "") {
  await contentActor();
  if (cursor.length > 80) throw new ContentError(400, "Invalid cursor.");
  const db = getFirebaseAdmin().db;
  let query = db
    .collection("website_submissions")
    .orderBy("createdAt", "desc")
    .orderBy("__name__", "desc");
  if (cursor) {
    if (!/^[a-f0-9]{64}$/.test(cursor))
      throw new ContentError(400, "Invalid cursor.");
    const last = await db.collection("website_submissions").doc(cursor).get();
    if (!last.exists) throw new ContentError(400, "Start from the first page.");
    query = query.startAfter(last);
  }
  const docs = (await query.limit(26).get()).docs;
  return {
    rows: docs.slice(0, 25).map((d) => {
      const v = d.data();
      return {
        id: d.id,
        kind: v.kind as string,
        adult: v.adult as boolean,
        fields: v.fields as Record<string, string>,
        status: v.status as string,
        revision: v.revision as number,
        createdAt: v.createdAt.toDate().toISOString() as string,
      };
    }),
    nextCursor: docs.length > 25 ? docs[24].id : null,
  };
}
export async function reviewEnquiry(raw: Record<string, unknown>) {
  const actor = await contentActor();
  if (
    typeof raw.id !== "string" ||
    !/^[a-f0-9]{64}$/.test(raw.id) ||
    ![
      "new",
      "safeguarding review",
      "in progress",
      "resolved",
      "spam",
      "archived",
    ].includes(String(raw.status)) ||
    !Number.isSafeInteger(raw.expectedRevision)
  )
    throw new ContentError(400, "Invalid review action.");
  const db = getFirebaseAdmin().db;
  return db.runTransaction(async (tx) => {
    await checkContentActor(tx, actor);
    const ref = db.collection("website_submissions").doc(String(raw.id)),
      doc = await tx.get(ref),
      v = doc.data();
    if (!v) throw new ContentError(404, "Enquiry not found.");
    if (v.revision !== raw.expectedRevision)
      throw new ContentError(
        409,
        "Another leader reviewed this enquiry. Refresh before trying again.",
      );
    tx.update(ref, {
      status: raw.status,
      revision: v.revision + 1,
      reviewedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(db.collection("audit_logs").doc(), {
      type: "website_submission_review",
      submissionId: ref.id,
      status: raw.status,
      actorUid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  });
}
