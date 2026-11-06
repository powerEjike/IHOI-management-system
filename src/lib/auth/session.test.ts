import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  cookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  getUser: vi.fn(),
  get: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mock.cookie }),
}));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("@/lib/firebase/admin", () => ({
  isFirebaseServerConfigured: () => true,
  getFirebaseAdmin: () => ({
    auth: mock,
    db: { collection: () => ({ doc: () => ({ get: mock.get }) }) },
  }),
}));
vi.mock("@/lib/auth/approval", () => ({
  readLeadershipApproval: async () => {
    const p = await import("@/lib/auth/policy");
    return p.parseStaffRecord((await mock.get()).data());
  },
}));
import { getStaffSession, requireStaff } from "./session";
beforeEach(() => {
  vi.clearAllMocks();
  mock.cookie.mockReturnValue({ value: "session" });
  mock.verifySessionCookie.mockResolvedValue({
    uid: "worker",
    firebase: { sign_in_second_factor: "totp" },
  });
  mock.getUser.mockResolvedValue({
    uid: "worker",
    email: "worker@example.invalid",
    emailVerified: true,
    disabled: false,
    multiFactor: { enrolledFactors: [{ uid: "test-factor" }] },
  });
  mock.get.mockResolvedValue({
    data: () => ({
      displayName: "Worker",
      active: true,
      roles: ["coo"],
    }),
  });
});
it("verifies revocation and checks live staff approval on every call", async () => {
  expect((await getStaffSession())?.roles).toEqual(["coo"]);
  expect(mock.verifySessionCookie).toHaveBeenCalledWith("session", true);
  mock.get.mockResolvedValue({
    data: () => ({
      displayName: "Worker",
      active: false,
      roles: ["coo"],
    }),
  });
  expect(await getStaffSession()).toBeNull();
});
it("rejects disabled accounts and revoked or forged cookies", async () => {
  mock.getUser.mockResolvedValue({ disabled: true });
  expect(await getStaffSession()).toBeNull();
  mock.verifySessionCookie.mockRejectedValue(new Error("revoked"));
  expect(await getStaffSession()).toBeNull();
});
it("does not accept unknown roles from the approval document", async () => {
  mock.get.mockResolvedValue({
    data: () => ({ displayName: "Worker", active: true, roles: ["owner"] }),
  });
  expect(await getStaffSession()).toBeNull();
});
it("protects role-specific operations separately from the portal layout", async () => {
  await expect(requireStaff(["super_admin"])).rejects.toThrow(
    "redirect:/portal/forbidden",
  );
  mock.cookie.mockReturnValue(undefined);
  await expect(requireStaff()).rejects.toThrow("redirect:/portal/login");
});
