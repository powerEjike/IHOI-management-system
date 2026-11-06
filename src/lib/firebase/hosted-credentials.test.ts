import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  oidc: vi.fn(async () => "opaque-token"),
  fromJSON: vi.fn(),
  firestore: vi.fn(),
  client: { credentials: { expiry_date: 0 }, getAccessToken: vi.fn() },
}));
vi.mock("server-only", () => ({}));
vi.mock("@vercel/oidc", () => ({ getVercelOidcToken: mocks.oidc }));
vi.mock("google-auth-library", () => ({
  ExternalAccountClient: { fromJSON: mocks.fromJSON },
}));
vi.mock("firebase-admin/firestore", () => ({
  Firestore: class {
    constructor(options: unknown) {
      mocks.firestore(options);
    }
  },
}));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  Object.assign(process.env, {
    GCP_PROJECT_NUMBER: "598846934135",
    GCP_WORKLOAD_IDENTITY_POOL_ID: "ihoi-vercel",
    GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: "vercel-production",
    GCP_SERVICE_ACCOUNT_EMAIL:
      "firebase-adminsdk-fbsvc@ihoi-management-system.iam.gserviceaccount.com",
  });
  mocks.client.credentials.expiry_date = Date.now() + 3600000;
  mocks.client.getAccessToken.mockResolvedValue({
    token: "opaque-google-token",
  });
  mocks.fromJSON.mockReturnValue(mocks.client);
});
it("uses request-scoped OIDC without passing the Google supplier context as a Vercel audience", async () => {
  const { hostedFirebaseCredentials } = await import("./hosted-credentials");
  const ready = hostedFirebaseCredentials("ihoi-management-system");
  const options = mocks.fromJSON.mock.calls[0][0];
  await options.subject_token_supplier.getSubjectToken({
    audience: "google-audience",
  });
  expect(mocks.oidc).toHaveBeenCalledWith();
  expect(mocks.firestore).toHaveBeenCalledWith(
    expect.objectContaining({
      projectId: "ihoi-management-system",
      authClient: mocks.client,
    }),
  );
  expect(await ready.credential.getAccessToken()).toMatchObject({
    access_token: "opaque-google-token",
  });
  expect(hostedFirebaseCredentials("ihoi-management-system")).toBe(ready);
});
it("fails closed for a mismatched service account or changed Firebase project", async () => {
  process.env.GCP_SERVICE_ACCOUNT_EMAIL = "other@example.invalid";
  const { hostedFirebaseCredentials } = await import("./hosted-credentials");
  expect(() => hostedFirebaseCredentials("ihoi-management-system")).toThrow();
});
it("rejects missing/expired Google tokens", async () => {
  mocks.client.credentials.expiry_date = Date.now() - 1;
  const { hostedFirebaseCredentials } = await import("./hosted-credentials");
  await expect(
    hostedFirebaseCredentials(
      "ihoi-management-system",
    ).credential.getAccessToken(),
  ).rejects.toThrow();
});
