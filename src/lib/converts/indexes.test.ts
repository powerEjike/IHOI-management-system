import { expect, it } from "vitest";
import configuration from "../../../firestore.indexes.json";
it("declares the indexes required by register filters and dashboard date counts", () => {
  for (const optional of [
    [],
    ["stage"],
    ["assignedLeaderRole"],
    ["searchKeys"],
    ["stage", "assignedLeaderRole"],
    ["stage", "searchKeys"],
    ["assignedLeaderRole", "searchKeys"],
    ["stage", "assignedLeaderRole", "searchKeys"],
  ]) {
    expect(
      configuration.indexes.some(
        (index) =>
          index.collectionGroup === "converts" &&
          index.fields.length === optional.length + 2 &&
          ["archived", "registeredDate", ...optional].every((name) =>
            index.fields.some((field) => field.fieldPath === name),
          ) &&
          index.fields.some(
            (field) =>
              field.fieldPath === "registeredDate" &&
              "order" in field &&
              field.order === "DESCENDING",
          ),
      ),
      optional.join(", "),
    ).toBe(true);
  }
  expect(
    configuration.indexes.some(
      (index) =>
        index.collectionGroup === "audit_logs" &&
        index.fields.some((field) => field.fieldPath === "convertId") &&
        index.fields.some(
          (field) =>
            field.fieldPath === "createdAt" &&
            "order" in field &&
            field.order === "DESCENDING",
        ),
    ),
  ).toBe(true);
});
