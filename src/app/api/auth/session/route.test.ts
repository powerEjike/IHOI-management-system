import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getUser: vi.fn(),
  get: vi.fn(),
  createSessionCookie: vi.fn(),
  configured: vi.fn(),
}));
vi.mock("@/lib/firebase/admin", () => ({
  isFirebaseServerConfigured: mocks.configured,
  getFirebaseAdmin: () => ({
    auth: mocks,
    db: { collection: () => ({ doc: () => ({ get: mocks.get }) }) },
  }),
}));
vi.mock("@/lib/auth/approval", () => ({
  readLeadershipApproval: async () => {
    const p = await import("@/lib/auth/policy");
    return p.parseStaffRecord((await mocks.get()).data());
  },
}));
import { DELETE, POST } from "./route";
function request(
  body: unknown = { idToken: "a".repeat(100) },
  origin = "http://localhost:3105",
) {
  return new NextRequest("http://localhost:3105/api/auth/session", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  mocks.configured.mockReturnValue(true);
  mocks.verifyIdToken.mockResolvedValue({
    uid: "worker",
    auth_time: Math.floor(Date.now() / 1000),
    firebase: { sign_in_second_factor: "totp" },
  });
  mocks.getUser.mockResolvedValue({
    uid: "worker",
    emailVerified: true,
    disabled: false,
    multiFactor: { enrolledFactors: [{ uid: "test-factor" }] },
  });
  mocks.get.mockResolvedValue({
    data: () => ({
      displayName: "Test Worker",
      active: true,
      roles: ["coo"],
    }),
  });
  mocks.createSessionCookie.mockResolvedValue("test-session");
});
describe("session API security contract", () => {
  it("preserves a loopback IP origin instead of accepting NextURL normalization", async () => {
    const result = await POST(
      new NextRequest("http://127.0.0.1:3105/api/auth/session", {
        method: "POST",
        headers: {
          host: "127.0.0.1:3105",
          origin: "http://127.0.0.1:3105",
          "content-type": "application/json",
        },
        body: JSON.stringify({ idToken: "a".repeat(100) }),
      }),
    );
    expect(result.status).toBe(200);
  });
  it("rejects cross-origin login and logout without touching Firebase", async () => {
    expect((await POST(request({}, "https://evil.example"))).status).toBe(403);
    expect((await DELETE(request({}, "https://evil.example"))).status).toBe(
      403,
    );
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
  });
  it("fails closed when unconfigured or given malformed tokens", async () => {
    mocks.configured.mockReturnValue(false);
    expect((await POST(request())).status).toBe(503);
    mocks.configured.mockReturnValue(true);
    expect((await POST(request({ idToken: 7 }))).status).toBe(400);
  });
  it("requires recent authentication and verifies token revocation", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "worker",
      auth_time: Math.floor(Date.now() / 1000) - 600,
    });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.verifyIdToken).toHaveBeenCalledWith("a".repeat(100), true);
    expect(mocks.createSessionCookie).not.toHaveBeenCalled();
  });
  it("does not issue sessions to deactivated staff or unverified users", async () => {
    mocks.get.mockResolvedValue({
      data: () => ({
        displayName: "Test",
        active: false,
        roles: ["super_admin"],
      }),
    });
    expect((await POST(request())).status).toBe(403);
    mocks.getUser.mockResolvedValue({ emailVerified: false });
    expect((await POST(request())).status).toBe(403);
    expect(mocks.createSessionCookie).not.toHaveBeenCalled();
  });
  it("does not issue a privileged session before MFA", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "worker",
      auth_time: Math.floor(Date.now() / 1000),
      firebase: {},
    });
    mocks.get.mockResolvedValue({
      data: () => ({
        displayName: "Test",
        active: true,
        roles: ["super_admin"],
      }),
    });
    const result = await POST(request());
    expect(await result.json()).toEqual({ code: "mfa_required" });
    expect(mocks.createSessionCookie).not.toHaveBeenCalled();
  });
  it("issues HttpOnly, same-site, uncached cookies only to approved staff", async () => {
    const result = await POST(request());
    expect(result.status).toBe(200);
    const cookie = result.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(result.headers.get("cache-control")).toContain("no-store");
  });
  it("clears the local server session on same-origin logout", async () => {
    const result = await DELETE(request());
    expect(result.status).toBe(200);
    expect(result.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
