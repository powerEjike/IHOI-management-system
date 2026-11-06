import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readPrivateJson } from "./http";
beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", ""));
function request(
  body: string,
  origin = "http://127.0.0.1:3105",
  type = "application/json",
) {
  return new NextRequest("http://127.0.0.1:3105/api/converts", {
    method: "POST",
    headers: { host: "127.0.0.1:3105", origin, "content-type": type },
    body,
  });
}
it("accepts same-origin JSON without putting personal search terms in URLs", async () => {
  expect(await readPrivateJson(request('{"q":"private search"}'))).toEqual({
    q: "private search",
  });
});
it("rejects cross-origin and non-JSON requests", async () => {
  await expect(
    readPrivateJson(request("{}", "https://other.example")),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    readPrivateJson(request("{}", undefined, "text/plain")),
  ).rejects.toMatchObject({ status: 415 });
});
it("rejects malformed objects and stops oversized bodies", async () => {
  for (const body of ["null", "[]", "invalid"])
    await expect(readPrivateJson(request(body))).rejects.toMatchObject({
      status: 400,
    });
  await expect(
    readPrivateJson(request(JSON.stringify({ text: "x".repeat(19000) }))),
  ).rejects.toMatchObject({ status: 413 });
});
