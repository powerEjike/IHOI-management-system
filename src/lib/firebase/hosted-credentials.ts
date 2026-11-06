import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient } from "google-auth-library";
import { Firestore } from "firebase-admin/firestore";
import type { Credential } from "firebase-admin/app";
let runtime:
  { projectId: string; credential: Credential; db: Firestore } | undefined;
export function hostedFirebaseCredentials(projectId: string) {
  if (runtime) {
    if (runtime.projectId !== projectId)
      throw new Error("Hosted Firebase project changed.");
    return runtime;
  }
  const number = process.env.GCP_PROJECT_NUMBER,
    pool = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID,
    provider = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
    email = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  if (
    !number ||
    !/^\d+$/.test(number) ||
    !pool ||
    !/^[a-z0-9-]+$/.test(pool) ||
    !provider ||
    !/^[a-z0-9-]+$/.test(provider) ||
    email !==
      "firebase-adminsdk-fbsvc@" + projectId + ".iam.gserviceaccount.com"
  )
    throw new Error("Hosted Firebase identity is not configured.");
  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience:
      "//iam.googleapis.com/projects/" +
      number +
      "/locations/global/workloadIdentityPools/" +
      pool +
      "/providers/" +
      provider,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" +
      email +
      ":generateAccessToken",
    subject_token_supplier: {
      getSubjectToken: async () => getVercelOidcToken(),
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  if (!client)
    throw new Error("Hosted Firebase identity could not be initialized.");
  const credential: Credential = {
    async getAccessToken() {
      const result = await client.getAccessToken();
      const expires = client.credentials.expiry_date;
      if (!result.token || !expires || expires <= Date.now())
        throw new Error("Hosted Firebase identity token is unavailable.");
      return {
        access_token: result.token,
        expires_in: Math.floor((expires - Date.now()) / 1000),
      };
    },
  };
  // Admin Auth accepts a Credential interface; Firestore uses its supported Google Auth client directly.
  const db = new Firestore({
    projectId,
    databaseId: process.env.FIREBASE_DATABASE_ID || "(default)",
    authClient: client,
  });
  runtime = { projectId, credential, db };
  return runtime;
}
