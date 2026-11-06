import { expect, it } from "vitest";
import { parseFirebaseWebConfig } from "./config";
it("keeps staff forms unavailable with no Firebase config", () => {
  expect(parseFirebaseWebConfig({})).toBeNull();
});
it("rejects partial or malformed Firebase configuration", () => {
  expect(() => parseFirebaseWebConfig({ apiKey: "AIza-example" })).toThrow();
  expect(() =>
    parseFirebaseWebConfig({
      apiKey: "secret",
      authDomain: "https://example.com",
      projectId: "test",
      appId: "wrong",
    }),
  ).toThrow();
});
it("accepts complete Firebase web identifiers", () => {
  expect(
    parseFirebaseWebConfig({
      apiKey: "AIza-example",
      authDomain: "ihoi-test.firebaseapp.com",
      projectId: "ihoi-test",
      appId: "1:123:web:456",
    })?.projectId,
  ).toBe("ihoi-test");
});
