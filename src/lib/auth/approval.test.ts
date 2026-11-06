import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ staff: {} as unknown, slot: {} as unknown }));
vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdmin: () => ({
    db: {
      collection: (name: string) => ({
        doc: () => ({
          get: async () => ({
            data: () => (name === "staff_access" ? state.staff : state.slot),
          }),
        }),
      }),
    },
  }),
}));
import { readLeadershipApproval } from "./approval";
beforeEach(() => {
  state.staff = { displayName: "Leader", active: true, roles: ["coo"] };
  state.slot = { uid: "approved-leader" };
});
it("approves only the user reserved in the leadership slot", async () => {
  expect((await readLeadershipApproval("approved-leader"))?.roles).toEqual([
    "coo",
  ]);
  expect(await readLeadershipApproval("fourth-account")).toBeNull();
});
it("rejects missing slots, inactive records, and unsupported staff roles", async () => {
  state.slot = undefined;
  expect(await readLeadershipApproval("approved-leader")).toBeNull();
  state.slot = { uid: "approved-leader" };
  state.staff = { displayName: "Leader", active: false, roles: ["coo"] };
  expect(await readLeadershipApproval("approved-leader")).toBeNull();
  state.staff = {
    displayName: "Worker",
    active: true,
    roles: ["follow_up_worker"],
  };
  expect(await readLeadershipApproval("approved-leader")).toBeNull();
});
