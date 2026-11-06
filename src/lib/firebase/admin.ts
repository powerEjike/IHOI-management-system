import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function getFirebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId || projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    throw new Error("Firebase server and web project IDs must match.");
  const name = "ihoi-server";
  const app =
    getApps().find((item) => item.name === name) ??
    initializeApp({ projectId, credential: applicationDefault() }, name);
  return {
    auth: getAuth(app),
    db: getFirestore(app, process.env.FIREBASE_DATABASE_ID || "(default)"),
  };
}

export function isFirebaseServerConfigured() {
  return Boolean(
    process.env.FIREBASE_ADMIN_ENABLED === "true" &&
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PROJECT_ID ===
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}
