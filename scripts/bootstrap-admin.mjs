// Run locally by an authorized project operator; never expose as a web endpoint.
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const uid = process.argv.find((value) => value.startsWith("--uid="))?.slice(6);
const displayName = process.argv
  .find((value) => value.startsWith("--name="))
  ?.slice(7)
  .trim();
const projectId = process.env.FIREBASE_PROJECT_ID;
if (
  !projectId ||
  projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  !uid ||
  !/^[a-zA-Z0-9_-]{1,128}$/.test(uid) ||
  !displayName ||
  displayName.length > 120
) {
  throw new Error(
    'Set matching Firebase project IDs and provide --uid=AUTH_USER_UID --name="Administrator name".',
  );
}
const app = initializeApp({ projectId, credential: applicationDefault() });
const user = await getAuth(app).getUser(uid);
if (user.disabled)
  throw new Error("A disabled account cannot be bootstrapped.");
const db = getFirestore(app, process.env.FIREBASE_DATABASE_ID || "(default)");
await db.runTransaction(async (transaction) => {
  const existing = await transaction.get(
    db
      .collection("staff_access")
      .where("roles", "array-contains", "super_admin"),
  );
  if (existing.docs.some((doc) => doc.data().active === true))
    throw new Error(
      "An active Super Admin already exists. Bootstrap is only for the first administrator.",
    );
  const staffRef = db.collection("staff_access").doc(uid);
  if ((await transaction.get(staffRef)).exists)
    throw new Error(
      "This staff record already exists. Review it without overwriting.",
    );
  transaction.create(staffRef, {
    displayName,
    active: true,
    roles: ["super_admin"],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  transaction.create(db.collection("audit_logs").doc(), {
    action: "bootstrap_super_admin",
    subjectUid: uid,
    actor: "project_operator",
    createdAt: FieldValue.serverTimestamp(),
  });
});
console.log(
  "First Super Admin approval created. Email verification and TOTP MFA are still required before portal access.",
);
