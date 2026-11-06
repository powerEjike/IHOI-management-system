import "server-only";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { contentActor } from "./service";
import { checkContentActor } from "./records";
import { ContentError, validContentId, websiteToday } from "./schema";
export type MediaInfo = {
  id: string;
  alt: string;
  permission: string;
  source: string;
  permissionDate: string;
  containsMinors: boolean;
  guardianConsent: boolean;
  withdrawn: boolean;
  bytes: number;
};
export function mediaMetadata(raw: Record<string, unknown>) {
  const alt = typeof raw.alt === "string" ? raw.alt.trim() : "";
  const source = typeof raw.source === "string" ? raw.source.trim() : "";
  const permissionDate =
    typeof raw.permissionDate === "string" ? raw.permissionDate : "";
  if (
    !alt ||
    alt.length > 200 ||
    source.length < 5 ||
    source.length > 300 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(permissionDate) ||
    !Number.isFinite(Date.parse(permissionDate)) ||
    new Date(permissionDate).toISOString().slice(0, 10) !== permissionDate ||
    permissionDate > websiteToday()
  )
    throw new ContentError(
      400,
      "Provide image description, permission source and a valid permission date.",
    );
  if (
    !["granted", "pending"].includes(String(raw.permission)) ||
    typeof raw.containsMinors !== "boolean" ||
    typeof raw.guardianConsent !== "boolean"
  )
    throw new ContentError(400, "Provide image permission details.");
  if (
    raw.containsMinors &&
    raw.permission === "granted" &&
    !raw.guardianConsent
  )
    throw new ContentError(
      400,
      "Guardian publication consent is required for identifiable minors.",
    );
  return {
    alt,
    source,
    permissionDate,
    permission: String(raw.permission),
    containsMinors: raw.containsMinors,
    guardianConsent: raw.guardianConsent,
  };
}
export async function library() {
  await contentActor();
  const docs = await getFirebaseAdmin()
    .db.collection("media_assets")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return docs.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      alt: v.alt,
      permission: v.permission,
      source: v.source,
      permissionDate: v.permissionDate,
      containsMinors: v.containsMinors,
      guardianConsent: v.guardianConsent,
      withdrawn: v.withdrawn,
      bytes: Number(v.byteLength || 0),
    } as MediaInfo;
  });
}
export async function uploadPhoto(raw: Record<string, unknown>) {
  const actor = await contentActor();
  if (
    Object.keys(raw).some(
      (k) =>
        ![
          "data",
          "alt",
          "source",
          "permissionDate",
          "permission",
          "containsMinors",
          "guardianConsent",
        ].includes(k),
    )
  )
    throw new ContentError(400, "Unsupported upload fields.");
  const info = mediaMetadata(raw);
  if (
    typeof raw.data !== "string" ||
    raw.data.length > 2800000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(raw.data)
  )
    throw new ContentError(
      400,
      "Upload a JPEG, PNG or WebP photo of at most 2 MB.",
    );
  const input = Buffer.from(raw.data, "base64");
  if (input.length > 2000000)
    throw new ContentError(413, "The photo must be at most 2 MB.");
  const isJpeg = input[0] === 255 && input[1] === 216 && input[2] === 255;
  const isPng = input
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp =
    input.toString("ascii", 0, 4) === "RIFF" &&
    input.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp)
    throw new ContentError(400, "Use a JPEG, PNG or WebP photo.");
  let bytes: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 16000000 });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format || "") ||
      (metadata.pages || 1) > 1
    )
      throw Error("Unsupported image");
    bytes = await image
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    if (bytes.length > 200000)
      bytes = await sharp(bytes)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 55 })
        .toBuffer();
    if (bytes.length > 200000) throw Error("Too large");
  } catch {
    throw new ContentError(
      400,
      "Use a still JPEG, PNG or WebP up to 16 megapixels. Try a smaller photo if optimization fails.",
    );
  }
  const db = getFirebaseAdmin().db,
    id = randomBytes(16).toString("hex");
  await db.runTransaction(async (tx) => {
    await checkContentActor(tx, actor);
    tx.create(db.collection("media_assets").doc(id), {
      ...info,
      byteLength: bytes.length,
      withdrawn: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
    });
    tx.create(
      db
        .collection("media_assets")
        .doc(id)
        .collection("image_data")
        .doc("image"),
      { bytes },
    );
    tx.create(db.collection("audit_logs").doc(), {
      type: "media_upload",
      mediaId: id,
      actorUid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { id };
}
export async function withdrawPhoto(raw: Record<string, unknown>) {
  const actor = await contentActor(),
    id = validContentId(raw.id);
  if (
    typeof raw.reason !== "string" ||
    raw.reason.trim().length < 5 ||
    raw.reason.length > 500
  )
    throw new ContentError(400, "Provide the withdrawal reason.");
  const db = getFirebaseAdmin().db;
  await db.runTransaction(async (tx) => {
    await checkContentActor(tx, actor);
    const ref = db.collection("media_assets").doc(id);
    if (!(await tx.get(ref)).exists)
      throw new ContentError(404, "Photo not found.");
    tx.update(ref, {
      withdrawn: true,
      withdrawnAt: FieldValue.serverTimestamp(),
      withdrawnBy: actor.uid,
    });
    tx.create(db.collection("audit_logs").doc(), {
      type: "media_withdrawal",
      mediaId: id,
      reason: raw.reason,
      actorUid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
}
export async function photoBytes(id: string) {
  validContentId(id);
  const ref = getFirebaseAdmin().db.collection("media_assets").doc(id),
    doc = await ref.get(),
    v = doc.data();
  if (!v || v.withdrawn) throw new ContentError(404, "Photo unavailable.");
  const staff = await getStaffSession();
  if (
    !staff &&
    (v.permission !== "granted" ||
      (await ref.collection("public_references").limit(1).get()).empty)
  )
    throw new ContentError(404, "Photo unavailable.");
  const image = await ref.collection("image_data").doc("image").get();
  if (!image.exists) throw new ContentError(404, "Photo unavailable.");
  return Buffer.from(image.data()!.bytes);
}

export async function approvePhoto(raw: Record<string, unknown>) {
  const actor = await contentActor(),
    id = validContentId(raw.id);
  const info = mediaMetadata(raw);
  if (info.permission !== "granted")
    throw new ContentError(400, "Provide granted publication permission.");
  const db = getFirebaseAdmin().db;
  await db.runTransaction(async (tx) => {
    await checkContentActor(tx, actor);
    const ref = db.collection("media_assets").doc(id),
      doc = await tx.get(ref);
    if (!doc.exists || doc.data()?.withdrawn)
      throw new ContentError(
        400,
        "Withdrawn or missing photos cannot be reapproved. Upload a new copy with new permission.",
      );
    tx.update(ref, {
      ...info,
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: actor.uid,
    });
    tx.create(db.collection("audit_logs").doc(), {
      type: "media_approval",
      mediaId: id,
      actorUid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
}
