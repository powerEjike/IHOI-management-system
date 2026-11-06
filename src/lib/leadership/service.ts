import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { parseStaffRecord, staffRoles } from "@/lib/auth/policy";
import { ApiError } from "@/lib/http";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
async function superAdmin() {
  const actor = await getStaffSession();
  if (!actor) throw new ApiError(401, "unauthorized", "Please sign in again.");
  if (actor.roles[0] !== "super_admin")
    throw new ApiError(
      403,
      "forbidden",
      "Only the Super Admin can invite leadership accounts.",
    );
  return actor;
}
export async function leadershipAccounts() {
  await superAdmin();
  const { auth, db } = getFirebaseAdmin();
  return Promise.all(
    staffRoles.map(async (role) => {
      const [slot, invite] = await Promise.all([
        db.collection("leadership_accounts").doc(role).get(),
        db.collection("leadership_invitations").doc(role).get(),
      ]);
      const uid = slot.data()?.uid;
      if (typeof uid === "string") {
        const [user, approval] = await Promise.all([
          auth.getUser(uid),
          db.collection("staff_access").doc(uid).get(),
        ]);
        const staff = parseStaffRecord(approval.data());
        return {
          role,
          state:
            user.disabled || !staff?.active || staff.roles[0] !== role
              ? "inactive"
              : "active",
          displayName: staff?.displayName || "Leadership account",
          email: user.email || "",
        };
      }
      const invitation = invite.data();
      const pending =
        invitation &&
        !invitation.usedByUid &&
        invitation.expiresAt.toMillis() > Date.now();
      return {
        role,
        state: pending ? "invited" : "available",
        displayName: pending ? String(invitation.displayName) : "Not set up",
        email: pending ? String(invitation.email) : "",
      };
    }),
  );
}
export async function createLeadershipInvitation(raw: Record<string, unknown>) {
  const actor = await superAdmin();
  const role = raw.role;
  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const displayName =
    typeof raw.displayName === "string" ? raw.displayName.trim() : "";
  if (
    !["president", "coo"].includes(String(role)) ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    displayName.length < 1 ||
    displayName.length > 120 ||
    email === actor.email.toLowerCase()
  )
    throw new ApiError(
      400,
      "invalid",
      "Choose President or COO and enter a different valid email and display name.",
    );
  const code = `${role}.${randomBytes(24).toString("base64url")}`;
  const { db } = getFirebaseAdmin();
  await db.runTransaction(async (tx) => {
    const [slot, root, currentStaff, otherInvite] = await Promise.all([
      tx.get(db.collection("leadership_accounts").doc(String(role))),
      tx.get(db.collection("leadership_accounts").doc("super_admin")),
      tx.get(db.collection("staff_access").doc(actor.uid)),
      tx.get(
        db
          .collection("leadership_invitations")
          .doc(role === "president" ? "coo" : "president"),
      ),
    ]);
    if (
      root.data()?.uid !== actor.uid ||
      !parseStaffRecord(currentStaff.data())?.active ||
      currentStaff.data()?.roles[0] !== "super_admin"
    )
      throw new ApiError(
        403,
        "forbidden",
        "Your account permission has changed.",
      );
    if (slot.exists)
      throw new ApiError(
        409,
        "occupied",
        "This leadership account is already set up. Additional accounts are not allowed.",
      );
    if (otherInvite.data()?.email === email)
      throw new ApiError(
        409,
        "invalid",
        "President and COO must use separate individual accounts.",
      );
    tx.set(db.collection("leadership_invitations").doc(String(role)), {
      email,
      displayName,
      tokenHash: hash(code),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000),
      createdAt: FieldValue.serverTimestamp(),
      createdByUid: actor.uid,
      usedByUid: null,
    });
    tx.create(db.collection("audit_logs").doc(), {
      action: "leadership_invitation_created",
      subjectRole: role,
      actorUid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { code, role, expiresInDays: 7 };
}
export async function acceptLeadershipInvitation(raw: Record<string, unknown>) {
  if (
    typeof raw.code !== "string" ||
    !/^(president|coo)\.[A-Za-z0-9_-]{32}$/.test(raw.code) ||
    typeof raw.idToken !== "string" ||
    raw.idToken.length > 10000
  )
    throw new ApiError(400, "invalid", "Enter a valid invitation code.");
  const { auth, db } = getFirebaseAdmin();
  let token;
  try {
    token = await auth.verifyIdToken(raw.idToken, true);
  } catch {
    throw new ApiError(
      401,
      "unauthorized",
      "Sign in again to complete account setup.",
    );
  }
  const user = await auth.getUser(token.uid);
  if (user.disabled || Date.now() / 1000 - token.auth_time > 300)
    throw new ApiError(
      401,
      "unauthorized",
      "Sign in again to complete account setup.",
    );
  if (!user.emailVerified || !user.email)
    throw new ApiError(
      403,
      "verify_email",
      "Verify your email, then complete account setup.",
    );
  const role = raw.code.split(".")[0];
  const codeHash = hash(raw.code);
  await db.runTransaction(async (tx) => {
    const [invite, slots, staff] = await Promise.all([
      tx.get(db.collection("leadership_invitations").doc(role)),
      Promise.all(
        staffRoles.map((key) =>
          tx.get(db.collection("leadership_accounts").doc(key)),
        ),
      ),
      tx.get(db.collection("staff_access").doc(user.uid)),
    ]);
    const data = invite.data();
    if (
      !data ||
      typeof data.tokenHash !== "string" ||
      data.tokenHash.length !== 64 ||
      !timingSafeEqual(Buffer.from(codeHash), Buffer.from(data.tokenHash)) ||
      data.email !== user.email!.toLowerCase() ||
      data.expiresAt.toMillis() <= Date.now()
    )
      throw new ApiError(
        403,
        "invalid_invitation",
        "This invitation is invalid, expired, or belongs to another email.",
      );
    if (
      data.usedByUid === user.uid &&
      slots[staffRoles.indexOf(role as "president" | "coo")].data()?.uid ===
        user.uid
    )
      return;
    if (
      data.usedByUid ||
      slots.some(
        (slot) =>
          slot.exists && (slot.id === role || slot.data()?.uid === user.uid),
      ) ||
      staff.exists
    )
      throw new ApiError(
        409,
        "occupied",
        "This leadership slot or account has already been assigned.",
      );
    tx.create(db.collection("leadership_accounts").doc(role), {
      uid: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.create(db.collection("staff_access").doc(user.uid), {
      displayName: data.displayName,
      active: true,
      roles: [role],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(invite.ref, {
      usedByUid: user.uid,
      usedAt: FieldValue.serverTimestamp(),
    });
    tx.create(db.collection("audit_logs").doc(), {
      action: "leadership_invitation_accepted",
      subjectRole: role,
      actorUid: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { role };
}
