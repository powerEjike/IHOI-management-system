import { describe, expect, it } from "vitest";
import {
  decideStaffAccess,
  hasAnyRole,
  isSameOrigin,
  parseStaffRecord,
  requiresMfa,
  type StaffRecord,
} from "./policy";
const leader: StaffRecord = {
  displayName: "Test Leader",
  active: true,
  roles: ["coo"],
};
describe("three-account leadership policy", () => {
  it("requires active approval and verified email", () => {
    const verified = {
      emailVerified: true,
      secondFactor: true,
      hasEnrolledFactor: true,
    };
    expect(decideStaffAccess({ ...verified, staff: null })).toBe("unapproved");
    expect(
      decideStaffAccess({ ...verified, staff: { ...leader, active: false } }),
    ).toBe("unapproved");
    expect(
      decideStaffAccess({ ...verified, staff: leader, emailVerified: false }),
    ).toBe("unverified");
  });
  it.each(["super_admin", "president", "coo"] as const)(
    "requires live MFA for %s",
    (role) => {
      const staff = { ...leader, roles: [role] };
      expect(requiresMfa(staff.roles)).toBe(true);
      expect(
        decideStaffAccess({
          staff,
          emailVerified: true,
          secondFactor: false,
          hasEnrolledFactor: true,
        }),
      ).toBe("mfa_required");
      expect(
        decideStaffAccess({
          staff,
          emailVerified: true,
          secondFactor: true,
          hasEnrolledFactor: false,
        }),
      ).toBe("mfa_required");
      expect(
        decideStaffAccess({
          staff,
          emailVerified: true,
          secondFactor: true,
          hasEnrolledFactor: true,
        }),
      ).toBe("allowed");
    },
  );
  it("rejects old staff roles, combined roles, and invalid profile data", () => {
    for (const roles of [
      [],
      ["follow_up_worker"],
      ["content_editor"],
      ["church_admin"],
      ["owner"],
      ["super_admin", "president"],
      ["coo", "coo"],
      [7],
    ])
      expect(parseStaffRecord({ ...leader, roles })).toBeNull();
    expect(parseStaffRecord({ ...leader, active: "true" })).toBeNull();
    expect(
      parseStaffRecord({ ...leader, displayName: "x".repeat(121) }),
    ).toBeNull();
    expect(hasAnyRole(leader.roles, ["super_admin"])).toBe(false);
    expect(hasAnyRole(leader.roles, [])).toBe(false);
  });
});
describe("same-origin protection", () => {
  it("requires an exact browser origin", () => {
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
