import { describe, expect, it } from "vitest";
import {
  decideStaffAccess,
  hasAnyRole,
  isSameOrigin,
  parseStaffRecord,
  requiresMfa,
  type StaffRecord,
} from "./policy";
const worker: StaffRecord = {
  displayName: "Test Worker",
  active: true,
  roles: ["follow_up_worker"],
};
describe("staff permission boundary", () => {
  it("requires approval even for authenticated users", () => {
    expect(
      decideStaffAccess({
        staff: null,
        emailVerified: true,
        secondFactor: true,
        hasEnrolledFactor: true,
      }),
    ).toBe("unapproved");
    expect(
      decideStaffAccess({
        staff: { ...worker, active: false },
        emailVerified: true,
        secondFactor: true,
        hasEnrolledFactor: true,
      }),
    ).toBe("unapproved");
  });
  it("requires verified email", () => {
    expect(
      decideStaffAccess({
        staff: worker,
        emailVerified: false,
        secondFactor: false,
        hasEnrolledFactor: false,
      }),
    ).toBe("unverified");
  });
  it("requires MFA for privileged roles including combined roles", () => {
    expect(requiresMfa(["content_editor", "super_admin"])).toBe(true);
    expect(
      decideStaffAccess({
        staff: { ...worker, roles: ["church_admin"] },
        emailVerified: true,
        secondFactor: false,
        hasEnrolledFactor: false,
      }),
    ).toBe("mfa_required");
    expect(
      decideStaffAccess({
        staff: { ...worker, roles: ["church_admin"] },
        emailVerified: true,
        secondFactor: true,
        hasEnrolledFactor: true,
      }),
    ).toBe("allowed");
  });
  it("does not bypass an opted-in or removed MFA factor", () => {
    expect(
      decideStaffAccess({
        staff: worker,
        emailVerified: true,
        secondFactor: false,
        hasEnrolledFactor: true,
      }),
    ).toBe("mfa_required");
    expect(
      decideStaffAccess({
        staff: { ...worker, roles: ["super_admin"] },
        emailVerified: true,
        secondFactor: true,
        hasEnrolledFactor: false,
      }),
    ).toBe("mfa_required");
  });
  it("allows approved workers and fails closed on unknown or empty roles", () => {
    expect(
      decideStaffAccess({
        staff: worker,
        emailVerified: true,
        secondFactor: false,
        hasEnrolledFactor: false,
      }),
    ).toBe("allowed");
    for (const roles of [
      [],
      ["owner"],
      ["super_admin", "owner"],
      ["secretary", "secretary"],
      [7],
    ])
      expect(parseStaffRecord({ ...worker, roles })).toBeNull();
    expect(parseStaffRecord({ ...worker, active: "true" })).toBeNull();
    expect(
      parseStaffRecord({ ...worker, displayName: "x".repeat(121) }),
    ).toBeNull();
    expect(hasAnyRole(worker.roles, ["super_admin"])).toBe(false);
    expect(hasAnyRole(worker.roles, [])).toBe(false);
  });
});
describe("session CSRF origin checks", () => {
  it("requires an exact origin", () => {
    expect(
      isSameOrigin("https://ministry.example", "https://ministry.example"),
    ).toBe(true);
    for (const value of [
      null,
      "null",
      "https://evil.example",
      "https://ministry.example.evil.example",
      "http://ministry.example",
      "https://ministry.example/path",
    ])
      expect(isSameOrigin(value, "https://ministry.example")).toBe(false);
  });
});
