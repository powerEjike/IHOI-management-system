import "server-only";
import { createHash } from "node:crypto";
import {
  FieldPath,
  FieldValue,
  type DocumentSnapshot,
  type Transaction,
} from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { parseStaffRecord } from "@/lib/auth/policy";
import {
  ConvertError,
  matchKeys,
  ministryToday,
  normalizeSearch,
  searchKeys,
  stages,
  validId,
  validRequestId,
  validateConvert,
  type ConvertInput,
  type ConvertRecord,
  type ConvertList,
} from "./model";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function convertActor() {
  const actor = await getStaffSession();
  if (!actor) throw new ConvertError("unauthorized", "Please sign in again.");
  return actor;
}
type Actor = NonNullable<Awaited<ReturnType<typeof getStaffSession>>>;
async function checkActor(tx: Transaction, actor: Actor) {
  const { db } = getFirebaseAdmin();
  const [staff, slot] = await Promise.all([
    tx.get(db.collection("staff_access").doc(actor.uid)),
    tx.get(db.collection("leadership_accounts").doc(actor.roles[0])),
  ]);
  const current = parseStaffRecord(staff.data());
  if (
    !current?.active ||
    current.roles[0] !== actor.roles[0] ||
    slot.data()?.uid !== actor.uid
  )
    throw new ConvertError(
      "forbidden",
      "Your leadership access has changed. Please sign in again.",
    );
}
function toRecord(document: DocumentSnapshot): ConvertRecord {
  const data = document.data()!;
  const input: ConvertInput = {
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    location: data.location,
    registeredDate: data.registeredDate,
    stage: data.stage,
    contactPermission: data.contactPermission,
    consentSource: data.consentSource,
    consentDate: data.consentDate,
    noContactReason: data.noContactReason,
    assignedLeaderRole: data.assignedLeaderRole,
    notes: data.notes,
  };
  return {
    ...input,
    id: document.id,
    archived: data.archived,
    revision: data.revision,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}
export async function listConverts(
  raw: Record<string, unknown> = {},
): Promise<ConvertList> {
  await convertActor();
  const { db } = getFirebaseAdmin();
  const q = typeof raw.q === "string" ? normalizeSearch(raw.q) : "";
  if (q.length > 80 || (q.length > 0 && q.length < 2))
    throw new ConvertError("invalid", "Search with 2–80 characters.");
  const stage = raw.stage || "all";
  if (stage !== "all" && !(stages as readonly unknown[]).includes(stage))
    throw new ConvertError("invalid", "Choose a valid stage filter.");
  let query = db
    .collection("converts")
    .where("archived", "==", raw.archived === true);
  if (stage !== "all") query = query.where("stage", "==", stage);
  if (raw.lead && raw.lead !== "all") {
    if (
      !["unassigned", "super_admin", "president", "coo"].includes(
        String(raw.lead),
      )
    )
      throw new ConvertError("invalid", "Choose a valid follow-up lead.");
    query = query.where(
      "assignedLeaderRole",
      "==",
      raw.lead === "unassigned" ? "" : raw.lead,
    );
  }
  if (raw.recent === true)
    query = query.where(
      "registeredDate",
      ">=",
      `${ministryToday().slice(0, 7)}-01`,
    );
  if (q) query = query.where("searchKeys", "array-contains", q);
  query = query
    .orderBy("registeredDate", "desc")
    .orderBy(FieldPath.documentId(), "desc");
  if (raw.after) {
    if (!validId(raw.after))
      throw new ConvertError(
        "invalid",
        "Invalid page. Start the search again.",
      );
    const cursor = await db.collection("converts").doc(raw.after).get();
    if (!cursor.exists)
      throw new ConvertError(
        "invalid",
        "This page has changed. Start the search again.",
      );
    query = query.startAfter(cursor);
  }
  const snapshot = await query.limit(26).get();
  const records = snapshot.docs.slice(0, 25).map((doc) => {
    const {
      notes: _notes,
      consentSource: _source,
      noContactReason: _reason,
      ...summary
    } = toRecord(doc);
    return summary;
  });
  return {
    records,
    nextCursor: snapshot.size > 25 ? records.at(-1)!.id : null,
  };
}
export async function getConvert(id: string) {
  await convertActor();
  if (!validId(id))
    throw new ConvertError("not_found", "Convert record not found.");
  const snapshot = await getFirebaseAdmin()
    .db.collection("converts")
    .doc(id)
    .get();
  if (!snapshot.exists)
    throw new ConvertError("not_found", "Convert record not found.");
  return toRecord(snapshot);
}
export async function convertHistory(id: string) {
  await getConvert(id);
  const history = await getFirebaseAdmin()
    .db.collection("audit_logs")
    .where("convertId", "==", id)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  return history.docs.map((doc) => ({
    id: doc.id,
    action: String(doc.data().action),
    actorName: String(doc.data().actorName),
    reason: String(doc.data().reason || ""),
    date: doc.data().createdAt.toDate().toISOString(),
  }));
}
export async function convertStats() {
  await convertActor();
  const query = getFirebaseAdmin()
    .db.collection("converts")
    .where("archived", "==", false);
  const month = `${ministryToday().slice(0, 7)}-01`;
  const [active, recent, unassigned, disciples] = await Promise.all([
    query.count().get(),
    query
      .where("registeredDate", ">=", month)
      .orderBy("registeredDate", "desc")
      .count()
      .get(),
    query.where("assignedLeaderRole", "==", "").count().get(),
    query.where("stage", "==", "disciple").count().get(),
  ]);
  return {
    active: active.data().count,
    recent: recent.data().count,
    unassigned: unassigned.data().count,
    disciples: disciples.data().count,
  };
}
export async function saveConvert(raw: Record<string, unknown>, id?: string) {
  const actor = await convertActor();
  const input = validateConvert(raw.input);
  if (!validRequestId(raw.requestId))
    throw new ConvertError("invalid", "Reload the form before saving.");
  if (id && !validId(id))
    throw new ConvertError("not_found", "Convert record not found.");
  if (
    id &&
    (!Number.isInteger(raw.expectedRevision) ||
      Number(raw.expectedRevision) < 1)
  )
    throw new ConvertError("invalid", "Reload this record before saving.");
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";
  const duplicateReason =
    typeof raw.duplicateReason === "string" ? raw.duplicateReason.trim() : "";
  if (reason.length > 500 || duplicateReason.length > 500)
    throw new ConvertError(
      "invalid",
      "Keep explanations within 500 characters.",
    );
  const fingerprint = hash(JSON.stringify({ input, reason, duplicateReason }));
  const recordId = id || hash(`${actor.uid}:${raw.requestId}`).slice(0, 32);
  const { db } = getFirebaseAdmin();
  await db.runTransaction(async (tx) => {
    await checkActor(tx, actor);
    const ref = db.collection("converts").doc(recordId);
    const current = await tx.get(ref);
    const previous = current.data();
    if (
      previous &&
      previous.lastMutationId === raw.requestId &&
      previous.lastMutationActor === actor.uid &&
      previous.lastMutationHash === fingerprint
    )
      return;
    if (!id && current.exists)
      throw new ConvertError(
        "conflict",
        "This registration was already submitted. Open the existing record.",
      );
    if (id && !current.exists)
      throw new ConvertError("not_found", "Convert record not found.");
    if (id && previous!.revision !== raw.expectedRevision)
      throw new ConvertError(
        "conflict",
        "This record changed after you opened it. Reload before saving; your entries are still here.",
      );
    if (previous?.archived)
      throw new ConvertError(
        "conflict",
        "Restore this archived record before editing it.",
      );
    if (
      (previous ? previous.stage !== input.stage : input.stage !== "convert") &&
      reason.length < 5
    )
      throw new ConvertError(
        "invalid",
        "Explain the ministry-stage change (at least 5 characters).",
      );
    if (input.assignedLeaderRole) {
      const slot = await tx.get(
        db.collection("leadership_accounts").doc(input.assignedLeaderRole),
      );
      const assigned = slot.data()?.uid
        ? await tx.get(db.collection("staff_access").doc(slot.data()!.uid))
        : null;
      if (!assigned || !parseStaffRecord(assigned.data())?.active)
        throw new ConvertError(
          "invalid",
          "That leadership account is not active yet. Choose unassigned for now.",
        );
    }
    const keys = matchKeys(input);
    const lockRefs = [
      ...new Set([...keys, ...(previous?.matchKeys || [])]),
    ].map((key) => db.collection("convert_match_locks").doc(hash(key)));
    await Promise.all(lockRefs.map((lock) => tx.get(lock)));
    const matches = await tx.get(
      db
        .collection("converts")
        .where("matchKeys", "array-contains-any", keys)
        .limit(12),
    );
    const duplicates = matches.docs
      .filter((doc) => doc.id !== recordId)
      .slice(0, 10)
      .map((doc) => ({
        id: doc.id,
        fullName: String(doc.data().fullName),
        archived: Boolean(doc.data().archived),
      }));
    if (duplicates.length && duplicateReason.length < 10)
      throw new ConvertError(
        "duplicate",
        "Possible existing records were found. Review them, or explain why this is a different person (at least 10 characters).",
        duplicates,
      );
    const revision = previous ? previous.revision + 1 : 1;
    const changedFields = previous
      ? Object.keys(input).filter(
          (key) => previous[key] !== input[key as keyof ConvertInput],
        )
      : Object.keys(input);
    const mutation = {
      ...input,
      searchKeys: searchKeys(input),
      matchKeys: keys,
      revision,
      updatedAt: FieldValue.serverTimestamp(),
      lastMutationId: raw.requestId,
      lastMutationActor: actor.uid,
      lastMutationHash: fingerprint,
    };
    if (previous) tx.update(ref, mutation);
    else
      tx.create(ref, {
        ...mutation,
        archived: false,
        createdByUid: actor.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    for (const lock of lockRefs)
      tx.set(lock, { updatedAt: FieldValue.serverTimestamp() });
    tx.create(
      db.collection("audit_logs").doc(`convert_${recordId}_r${revision}`),
      {
        convertId: recordId,
        action: previous ? "convert_updated" : "convert_created",
        actorUid: actor.uid,
        actorName: actor.displayName,
        reason,
        fieldsChanged: changedFields,
        stageBefore: previous?.stage || null,
        stageAfter: input.stage,
        permissionBefore: previous?.contactPermission || null,
        permissionAfter: input.contactPermission,
        duplicateIds: duplicates.map((item) => item.id),
        duplicateReason: duplicates.length ? duplicateReason : "",
        createdAt: FieldValue.serverTimestamp(),
      },
    );
    if ((previous?.assignedLeaderRole || "") !== input.assignedLeaderRole)
      tx.create(
        db.collection("assignment_history").doc(`${recordId}_r${revision}`),
        {
          convertId: recordId,
          previousRole: previous?.assignedLeaderRole || "",
          nextRole: input.assignedLeaderRole,
          actorUid: actor.uid,
          createdAt: FieldValue.serverTimestamp(),
        },
      );
  });
  return { id: recordId };
}
export async function archiveConvert(id: string, raw: Record<string, unknown>) {
  const actor = await convertActor();
  if (
    !validId(id) ||
    !validRequestId(raw.requestId) ||
    typeof raw.archived !== "boolean" ||
    !Number.isInteger(raw.expectedRevision) ||
    typeof raw.reason !== "string" ||
    raw.reason.trim().length < 5 ||
    raw.reason.length > 500
  )
    throw new ConvertError(
      "invalid",
      "Provide a reason of 5–500 characters and reload if this record has changed.",
    );
  const { db } = getFirebaseAdmin();
  const fingerprint = hash(
    JSON.stringify({ archived: raw.archived, reason: raw.reason.trim() }),
  );
  const reason = raw.reason.trim();
  await db.runTransaction(async (tx) => {
    await checkActor(tx, actor);
    const ref = db.collection("converts").doc(id);
    const snapshot = await tx.get(ref);
    const current = snapshot.data();
    if (!current)
      throw new ConvertError("not_found", "Convert record not found.");
    if (
      current.lastMutationId === raw.requestId &&
      current.lastMutationActor === actor.uid &&
      current.lastMutationHash === fingerprint
    )
      return;
    if (current.revision !== raw.expectedRevision)
      throw new ConvertError(
        "conflict",
        "This record changed. Reload before continuing.",
      );
    if (current.archived === raw.archived)
      throw new ConvertError(
        "conflict",
        "This record already has that status. Reload it.",
      );
    const revision = current.revision + 1;
    tx.update(ref, {
      archived: raw.archived,
      revision,
      updatedAt: FieldValue.serverTimestamp(),
      lastMutationId: raw.requestId,
      lastMutationActor: actor.uid,
      lastMutationHash: fingerprint,
    });
    tx.create(db.collection("audit_logs").doc(`convert_${id}_r${revision}`), {
      convertId: id,
      action: raw.archived ? "convert_archived" : "convert_restored",
      actorUid: actor.uid,
      actorName: actor.displayName,
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { id };
}
