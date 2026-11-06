import { beforeEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  actor: null as unknown,
  occupied: false,
  active: true,
  writes: [] as { path: string; data: Record<string, unknown> }[],
}));
vi.mock("@/lib/auth/session", () => ({
  getStaffSession: async () => state.actor,
}));
vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdmin: () => ({
    db: {
      collection: (name: string) => ({
        doc: (id = "audit") => ({ path: `${name}/${id}` }),
      }),
      runTransaction: async (callback: (tx: unknown) => unknown) =>
        callback({
          get: async (ref: { path: string }) => ({
            exists:
              ref.path === "leadership_accounts/president" && state.occupied,
            data: () =>
              ref.path === "leadership_accounts/super_admin"
                ? { uid: "root" }
                : ref.path === "staff_access/root"
                  ? {
                      displayName: "Root",
                      active: state.active,
                      roles: ["super_admin"],
                    }
                  : undefined,
          }),
          set: (ref: { path: string }, data: Record<string, unknown>) =>
            state.writes.push({ path: ref.path, data }),
          create: (ref: { path: string }, data: Record<string, unknown>) =>
            state.writes.push({ path: ref.path, data }),
        }),
    },
  }),
}));
import { createLeadershipInvitation } from "./service";
const input = {
  role: "president",
  email: "president@example.invalid",
  displayName: "President",
};
beforeEach(() => {
  state.actor = {
    uid: "root",
    email: "root@example.invalid",
    roles: ["super_admin"],
  };
  state.occupied = false;
  state.active = true;
  state.writes = [];
});
it("limits invitations to the Super Admin and prevents a Super Admin signup slot", async () => {
  state.actor = null;
  await expect(createLeadershipInvitation(input)).rejects.toMatchObject({
    status: 401,
  });
  state.actor = { roles: ["coo"] };
  await expect(createLeadershipInvitation(input)).rejects.toMatchObject({
    status: 403,
  });
  state.actor = {
    uid: "root",
    email: "root@example.invalid",
    roles: ["super_admin"],
  };
  await expect(
    createLeadershipInvitation({ ...input, role: "super_admin" }),
  ).rejects.toMatchObject({ status: 400 });
  expect(state.writes).toEqual([]);
});
it("returns a private code but stores only its digest with a seven-day expiry", async () => {
  const result = await createLeadershipInvitation(input);
  expect(result.code).toMatch(/^president\.[A-Za-z0-9_-]{32}$/);
  const invitation = state.writes.find(
    (write) => write.path === "leadership_invitations/president",
  )!.data;
  expect(invitation.tokenHash).toBe(
    createHash("sha256").update(result.code).digest("hex"),
  );
  expect(JSON.stringify(invitation)).not.toContain(result.code);
  expect(
    (invitation.expiresAt as { toMillis: () => number }).toMillis(),
  ).toBeGreaterThan(Date.now() + 6 * 86400000);
});
it("does not replace occupied leadership slots or write after approval is revoked", async () => {
  state.occupied = true;
  await expect(createLeadershipInvitation(input)).rejects.toMatchObject({
    status: 409,
  });
  state.occupied = false;
  state.active = false;
  await expect(createLeadershipInvitation(input)).rejects.toMatchObject({
    status: 403,
  });
  expect(state.writes).toEqual([]);
});
