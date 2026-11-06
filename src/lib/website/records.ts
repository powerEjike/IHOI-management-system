import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import {
  getFirebaseAdmin,
  isFirebaseServerConfigured,
} from "@/lib/firebase/admin";
import { parseStaffRecord } from "@/lib/auth/policy";
import { contentActor } from "./service";
import {
  ContentError,
  contentKind,
  validContentId,
  validateFields,
  publicFields,
  imageIds,
  newFields,
  type ContentKind,
} from "./schema";
export type WebRecord = {
  id: string;
  kind: ContentKind;
  version: number;
  status: string;
  publishedVersion: number | null;
  draft: Record<string, string>;
  media: { id: string; alt: string }[];
};
export type PublicRecord = {
  id: string;
  kind: ContentKind;
  fields: Record<string, string>;
  media: { id: string; alt: string }[];
};
export function recordsRef(kind: ContentKind, published = false) {
  return getFirebaseAdmin()
    .db.collection(published ? "website_public" : "website_records")
    .doc(kind)
    .collection("items");
}
export async function checkContentActor(
  tx: Transaction,
  actor: Awaited<ReturnType<typeof contentActor>>,
) {
  const db = getFirebaseAdmin().db;
  const [staff, slot] = await Promise.all([
    tx.get(db.collection("staff_access").doc(actor.uid)),
    tx.get(db.collection("leadership_accounts").doc(actor.roles[0])),
  ]);
  const parsed = parseStaffRecord(staff.data());
  if (
    !parsed?.active ||
    parsed.roles[0] !== actor.roles[0] ||
    slot.data()?.uid !== actor.uid
  )
    throw new ContentError(403, "Your leadership access has changed.");
}
export async function privateRecords(kind: ContentKind) {
  await contentActor();
  return (
    await recordsRef(kind).orderBy("updatedAt", "desc").limit(100).get()
  ).docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
        updatedAt: d.data().updatedAt?.toDate().toISOString(),
      }) as WebRecord & { updatedAt: string },
  );
}
export async function privateRecord(kind: ContentKind, id: string) {
  await contentActor();
  const ref = recordsRef(kind).doc(validContentId(id));
  const doc = await ref.get();
  if (!doc.exists)
    return {
      record: {
        id,
        kind,
        version: 0,
        status: "draft",
        publishedVersion: null,
        draft: newFields(kind),
        media: [],
      } as WebRecord,
      history: [],
    };
  const history = await ref
    .collection("revisions")
    .orderBy("version", "desc")
    .limit(20)
    .get();
  return {
    record: {
      id,
      kind,
      version: doc.data()!.version,
      status: doc.data()!.status,
      publishedVersion: doc.data()!.publishedVersion,
      draft: doc.data()!.draft,
      media: doc.data()!.media || [],
    } as WebRecord,
    history: history.docs.map((d) => {
      const v = d.data();
      return {
        version: v.version as number,
        action: v.action as string,
        at: v.at.toDate().toISOString() as string,
      };
    }),
  };
}
async function activeMedia(records: PublicRecord[], coversOnly = false) {
  const candidates = records.flatMap((r) =>
    coversOnly ? (r.media || []).slice(0, 1) : r.media || [],
  );
  const ids = [...new Set(candidates.map((m) => m.id))].filter((id) =>
    /^[a-f0-9]{32}$/.test(id),
  );
  if (!ids.length) return records.map((r) => ({ ...r, media: [] }));
  const docs = await getFirebaseAdmin().db.getAll(
    ...ids.map((id) =>
      getFirebaseAdmin().db.collection("media_assets").doc(id),
    ),
  );
  const active = new Set(
    docs
      .filter(
        (d) =>
          d.exists &&
          d.data()?.permission === "granted" &&
          !d.data()?.withdrawn,
      )
      .map((d) => d.id),
  );
  return records.map((r) => ({
    ...r,
    media: (coversOnly ? (r.media || []).slice(0, 1) : r.media || []).filter(
      (m) => active.has(m.id),
    ),
  }));
}
export async function publicRecords(
  kind: ContentKind,
  q = "",
  cursor = "",
  limit = 12,
) {
  if (!isFirebaseServerConfigured())
    return { records: [] as PublicRecord[], nextCursor: null as string | null };
  if (q.length > 80 || cursor.length > 240)
    throw new ContentError(400, "Search is too long.");
  let query = recordsRef(kind, true).orderBy("sortKey");
  const term = q.trim().toLocaleLowerCase();
  if (term) query = query.startAt(term).endAt(term + "\uf8ff");
  if (cursor && (!term || cursor.startsWith(term)))
    query = query.startAfter(cursor);
  const docs = (await query.limit(limit + 1).get()).docs;
  return {
    records: await activeMedia(
      docs
        .slice(0, limit)
        .map((d) => ({ id: d.id, kind, ...d.data() }) as PublicRecord),
      true,
    ),
    nextCursor:
      docs.length > limit ? (docs[limit - 1].data().sortKey as string) : null,
  };
}
export async function publicRecord(
  kind: ContentKind,
  id: string,
): Promise<PublicRecord | null> {
  if (!isFirebaseServerConfigured()) return null;
  const doc = await recordsRef(kind, true).doc(validContentId(id)).get();
  return doc.exists
    ? (await activeMedia([{ id, kind, ...doc.data() } as PublicRecord]))[0]
    : null;
}
export async function upcomingEvents() {
  if (!isFirebaseServerConfigured()) return [];
  const docs = await recordsRef("events", true)
    .where("start", ">=", new Date().toISOString())
    .orderBy("start")
    .limit(6)
    .get();
  return activeMedia(
    docs.docs
      .map((d) => ({ id: d.id, kind: "events", ...d.data() }) as PublicRecord)
      .filter((d) => d.fields.activityStatus === "planned")
      .slice(0, 3),
    true,
  );
}
export async function changeRecord(raw: Record<string, unknown>) {
  const actor = await contentActor(),
    kind = contentKind(raw.kind),
    id = validContentId(raw.id);
  if (
    (kind === "settings" && id !== "main") ||
    (kind !== "settings" && id === "main")
  )
    throw new ContentError(400, "Invalid record ID.");
  if (
    Object.keys(raw).some(
      (k) =>
        ![
          "kind",
          "id",
          "expectedVersion",
          "requestId",
          "action",
          "fields",
          "restoreVersion",
        ].includes(k),
    )
  )
    throw new ContentError(400, "Unsupported action fields.");
  const action = String(raw.action);
  if (
    !["save", "publish", "unpublish", "archive", "restore"].includes(action) ||
    !Number.isSafeInteger(raw.expectedVersion) ||
    Number(raw.expectedVersion) < 0 ||
    typeof raw.requestId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(raw.requestId)
  )
    throw new ContentError(400, "Invalid content action.");
  const draft = action === "save" ? validateFields(kind, raw.fields) : null;
  if (
    action === "restore" &&
    (!Number.isSafeInteger(raw.restoreVersion) ||
      Number(raw.restoreVersion) < 1)
  )
    throw new ContentError(400, "Choose an existing revision.");
  const db = getFirebaseAdmin().db,
    ref = recordsRef(kind).doc(id),
    pub = recordsRef(kind, true).doc(id),
    receipt = ref.collection("operations").doc(
      createHash("sha256")
        .update(actor.uid + ":" + raw.requestId)
        .digest("hex"),
    ),
    fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          action,
          expected: raw.expectedVersion,
          draft,
          restore: raw.restoreVersion || null,
        }),
      )
      .digest("hex");
  return db.runTransaction(async (tx) => {
    await checkContentActor(tx, actor);
    const [old, publicDoc, done, restore] = await Promise.all([
      tx.get(ref),
      tx.get(pub),
      tx.get(receipt),
      action === "restore"
        ? tx.get(ref.collection("revisions").doc(String(raw.restoreVersion)))
        : Promise.resolve(null),
    ]);
    if (done.exists) {
      if (done.data()?.fingerprint !== fingerprint)
        throw new ContentError(409, "This request ID was already used.");
      return { version: done.data()!.version };
    }
    const previous = old.data();
    if ((previous?.version || 0) !== raw.expectedVersion)
      throw new ContentError(
        409,
        "Another leader changed this item. Your entries are preserved; reload before saving.",
      );
    if (action === "restore" && !restore?.exists)
      throw new ContentError(404, "Revision not found.");
    if (
      action === "publish" &&
      (!old.exists || previous?.status === "archived")
    )
      throw new ContentError(400, "Save or restore a draft before publishing.");
    const fields = validateFields(
      kind,
      draft ||
        (action === "restore" ? restore?.data()?.draft : previous?.draft) ||
        newFields(kind),
      action === "publish",
    );
    if (
      action === "publish" &&
      kind === "settings" &&
      fields.formsEnabled === "yes" &&
      (process.env.PUBLIC_FORM_RATE_LIMIT_SECRET || "").length < 32
    )
      throw new ContentError(
        400,
        "The form protection secret must be configured before opening public forms.",
      );
    const ids = kind === "settings" ? [] : imageIds(fields.images || "");
    const assets =
      action === "publish"
        ? await Promise.all(
            ids.map((image) =>
              tx.get(db.collection("media_assets").doc(image)),
            ),
          )
        : [];
    const media = assets.map((asset) => {
      const v = asset.data();
      if (!v || v.permission !== "granted" || v.withdrawn)
        throw new ContentError(
          400,
          "Every photo must have active publication permission.",
        );
      return { id: asset.id, alt: v.alt as string };
    });
    const version = Number(raw.expectedVersion) + 1,
      now = FieldValue.serverTimestamp(),
      hide = action === "unpublish" || action === "archive",
      publishedVersion =
        action === "publish"
          ? version
          : hide
            ? null
            : previous?.publishedVersion || null,
      status =
        action === "archive"
          ? "archived"
          : publishedVersion
            ? "published"
            : "draft";
    tx.set(ref, {
      kind,
      version,
      status,
      publishedVersion,
      draft: fields,
      updatedAt: now,
      updatedBy: actor.uid,
      media: action === "publish" ? media : previous?.media || [],
    });
    tx.create(ref.collection("revisions").doc(String(version)), {
      version,
      action,
      draft: fields,
      actorUid: actor.uid,
      at: now,
    });
    tx.create(receipt, { version, fingerprint });
    if (action === "publish" || hide) {
      const key = kind + "-" + id;
      for (const image of (publicDoc.data()?.media || []) as { id: string }[])
        if (action !== "publish" || !media.some((m) => m.id === image.id))
          tx.delete(
            db
              .collection("media_assets")
              .doc(image.id)
              .collection("public_references")
              .doc(key),
          );
      if (action === "publish") {
        for (const image of media)
          tx.set(
            db
              .collection("media_assets")
              .doc(image.id)
              .collection("public_references")
              .doc(key),
            { kind, id },
          );
        tx.set(pub, {
          kind,
          fields: publicFields(kind, fields),
          media,
          version,
          publishedAt: now,
          sortKey: (fields.title || "").toLocaleLowerCase() + "-" + id,
          ...(fields.start
            ? { start: new Date(fields.start + "+01:00").toISOString() }
            : {}),
        });
      } else tx.delete(pub);
    }
    tx.create(db.collection("audit_logs").doc(), {
      type: "website_record",
      kind,
      recordId: id,
      action,
      version,
      actorUid: actor.uid,
      createdAt: now,
    });
    return { version };
  });
}
export const newContentId = () => randomBytes(16).toString("hex");
