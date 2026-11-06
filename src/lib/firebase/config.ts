export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export function parseFirebaseWebConfig(
  values: Record<string, string | undefined>,
): FirebaseWebConfig | null {
  const { apiKey, authDomain, projectId, appId } = values;
  if (![apiKey, authDomain, projectId, appId].some((value) => value?.trim()))
    return null;
  if (![apiKey, authDomain, projectId, appId].every((value) => value?.trim()))
    throw new Error(
      "All four Firebase web configuration values are required together.",
    );
  if (
    !/^[a-z0-9][a-z0-9.-]+$/.test(authDomain!) ||
    !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId!) ||
    !apiKey!.startsWith("AIza") ||
    !appId!.includes(":web:")
  ) {
    throw new Error(
      "Invalid Firebase web configuration. Copy the web app configuration from Firebase project settings.",
    );
  }
  return {
    apiKey: apiKey!,
    authDomain: authDomain!,
    projectId: projectId!,
    appId: appId!,
  };
}

export function getFirebaseWebConfig() {
  return parseFirebaseWebConfig({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}
