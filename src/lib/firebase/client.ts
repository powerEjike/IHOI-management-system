"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";
import { getFirebaseWebConfig } from "./config";

export async function getBrowserAuth() {
  const config = getFirebaseWebConfig();
  if (!config) throw new Error("Firebase is not configured.");
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);
  return auth;
}
