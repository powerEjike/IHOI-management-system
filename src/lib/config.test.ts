import { describe, expect, it } from "vitest";
import { parseSiteUrl } from "./config";

describe("canonical site origin", () => {
  it("allows unconfigured local development without inventing a production address", () => {
    expect(parseSiteUrl(undefined)).toBeUndefined();
    expect(parseSiteUrl("  ")).toBeUndefined();
  });
  it("accepts a deployment origin and local preview origin", () => {
    expect(parseSiteUrl("https://ministry.example")?.origin).toBe(
      "https://ministry.example",
    );
    expect(parseSiteUrl("http://localhost:3000")?.origin).toBe(
      "http://localhost:3000",
    );
  });
  it.each([
    "invalid",
    "javascript:alert(1)",
    "ftp://example.com",
    "https://a:b@example.com",
    "https://example.com/private",
    "https://example.com?secret=1",
    "https://example.com/#fragment",
  ])("rejects unsafe or ambiguous configuration: %s", (value) => {
    expect(() => parseSiteUrl(value)).toThrow();
  });
});
