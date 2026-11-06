import { describe, expect, it } from "vitest";
import {
  ConvertError,
  matchKeys,
  ministryToday,
  normalizeSearch,
  searchKeys,
  validateConvert,
} from "./model";
const input = {
  fullName: "Éjike Echezona",
  phone: "+234 801 234 5678",
  email: "LEADER@example.invalid",
  location: "Abuja",
  registeredDate: "2026-11-06",
  stage: "convert",
  contactPermission: "unknown",
  consentSource: "",
  consentDate: "",
  noContactReason: "",
  assignedLeaderRole: "",
  notes: "Private note",
};
describe("convert record validation", () => {
  it("normalizes contact details and keeps valid records", () => {
    expect(validateConvert(input, "2026-11-06").email).toBe(
      "leader@example.invalid",
    );
  });
  it.each(["2026-11-07", "2026-02-30", "not-a-date"])(
    "rejects future or impossible registration date %s",
    (date) => {
      expect(() =>
        validateConvert({ ...input, registeredDate: date }, "2026-11-06"),
      ).toThrow(ConvertError);
    },
  );
  it("requires a reason when neither phone nor email is available", () => {
    expect(() =>
      validateConvert({ ...input, phone: "", email: "" }, "2026-11-06"),
    ).toThrow();
    expect(
      validateConvert(
        {
          ...input,
          phone: "",
          email: "",
          noContactReason: "Details not available",
        },
        "2026-11-06",
      ).noContactReason,
    ).toBe("Details not available");
  });
  it.each(["granted", "declined"])(
    "requires evidence and a date for %s contact permission",
    (permission) => {
      expect(() =>
        validateConvert(
          { ...input, contactPermission: permission },
          "2026-11-06",
        ),
      ).toThrow();
      expect(
        validateConvert(
          {
            ...input,
            contactPermission: permission,
            consentSource: "Confirmed in person",
            consentDate: "2026-11-06",
          },
          "2026-11-06",
        ).contactPermission,
      ).toBe(permission);
    },
  );
  it("blocks schema pollution, oversized fields, invalid enums, and fake assignments", () => {
    for (const extra of [
      { notes: "x".repeat(3001) },
      { roles: ["super_admin"] },
      { archived: true },
      { stage: "admin" },
      { assignedLeaderRole: "unknown-person" },
      { phone: "abc" },
    ])
      expect(() =>
        validateConvert({ ...input, ...extra }, "2026-11-06"),
      ).toThrow();
  });
  it("uses the ministry timezone at the midnight boundary", () => {
    expect(ministryToday(new Date("2026-11-05T23:30:00Z"))).toBe("2026-11-06");
  });
});
describe("duplicate and search normalization", () => {
  it("matches name order, accents, case, and formatted phone numbers", () => {
    const first = validateConvert(input, "2026-11-06");
    const second = validateConvert(
      { ...input, fullName: "Echezona Ejike", phone: "+2348012345678" },
      "2026-11-06",
    );
    expect(matchKeys(first)).toEqual(matchKeys(second));
    expect(searchKeys(first)).toContain("ejike");
    expect(searchKeys(first)).toContain("echez");
    expect(normalizeSearch("+234 801")).toBe("234801");
    expect(searchKeys(first).length).toBeLessThanOrEqual(300);
  });
});
