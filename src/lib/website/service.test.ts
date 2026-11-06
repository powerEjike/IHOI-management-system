import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  actor: {
    uid: "leader",
    roles: ["coo"],
    displayName: "Leader",
    email: "leader@example.invalid",
  } as {
    uid: string;
    roles: string[];
    displayName: string;
    email: string;
  } | null,
  rows: new Map<string, Record<string, unknown>>(),
  seq: 0,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  getStaffSession: async () => state.actor,
}));
vi.mock("@/lib/firebase/admin", () => {
  function ref(path: string): any {
    return {
      path,
      collection: (name: string) => ({
        doc: (id?: string) =>
          ref(path + "/" + name + "/" + (id || "auto" + ++state.seq)),
      }),
      get: async () => snap(path),
    };
  }
  function snap(path: string) {
    return { exists: state.rows.has(path), data: () => state.rows.get(path) };
  }
  const db = {
    collection: (name: string) => ({
      doc: (id?: string) => ref(name + "/" + (id || "auto" + ++state.seq)),
    }),
    runTransaction: async (fn: any) => {
      const pending: (() => void)[] = [];
      const result = await fn({
        get: async (r: any) => snap(r.path),
        set: (r: any, v: any) => pending.push(() => state.rows.set(r.path, v)),
        create: (r: any, v: any) =>
          pending.push(() => {
            if (state.rows.has(r.path)) throw Error("already exists");
            state.rows.set(r.path, v);
          }),
        delete: (r: any) => pending.push(() => state.rows.delete(r.path)),
      });
      pending.forEach((f) => f());
      return result;
    },
  };
  return {
    getFirebaseAdmin: () => ({ db }),
    isFirebaseServerConfigured: () => true,
  };
});
import { changePage, publishedPage } from "./service";
import { validateCopy, pageSlug, expectedVersion } from "./model";
const copy = {
  title: "Approved title",
  description: "Approved summary",
  heading: "Our story",
  body: "Public story.",
};
const request = (action: string, version: number, extra = {}) => ({
  slug: "about",
  action,
  expectedVersion: version,
  requestId: crypto.randomUUID(),
  ...extra,
});
beforeEach(() => {
  state.rows.clear();
  state.actor = {
    uid: "leader",
    roles: ["coo"],
    displayName: "Leader",
    email: "leader@example.invalid",
  };
  state.rows.set("staff_access/leader", {
    active: true,
    roles: ["coo"],
    displayName: "Leader",
  });
  state.rows.set("leadership_accounts/coo", { uid: "leader" });
});
it("keeps drafts private, retains public copy during edits, and requires explicit publication", async () => {
  await changePage(request("save", 0, { copy }));
  expect(await publishedPage("about")).toBeNull();
  await changePage(request("publish", 1));
  expect(await publishedPage("about")).toEqual(copy);
  await changePage(
    request("save", 2, {
      copy: { ...copy, body: "Private unfinished changes" },
    }),
  );
  expect(await publishedPage("about")).toEqual(copy);
  await changePage(request("publish", 3));
  expect((await publishedPage("about"))?.body).toBe(
    "Private unfinished changes",
  );
});
it("removes public projection on unpublish/archive while retaining revision history", async () => {
  await changePage(request("save", 0, { copy }));
  await changePage(request("publish", 1));
  await changePage(request("archive", 2));
  expect(await publishedPage("about")).toBeNull();
  expect(state.rows.has("website_pages/about/revisions/3")).toBe(true);
  await expect(changePage(request("publish", 3))).rejects.toMatchObject({
    status: 400,
  });
  await changePage(request("restore", 3, { restoreVersion: 1 }));
  expect(await publishedPage("about")).toBeNull();
  expect(state.rows.get("website_pages/about")?.status).toBe("draft");
  await changePage(request("publish", 4));
  await changePage(request("unpublish", 5));
  expect(await publishedPage("about")).toBeNull();
});
it("rejects stale writes and makes exact retries idempotent with one audit event", async () => {
  const body = request("save", 0, { copy });
  await changePage(body);
  await changePage(body);
  expect(
    [...state.rows.keys()].filter((k) => k.startsWith("audit_logs/")),
  ).toHaveLength(1);
  await expect(changePage(request("save", 0, { copy }))).rejects.toMatchObject({
    status: 409,
  });
  await expect(
    changePage({ ...body, copy: { ...copy, body: "Different" } }),
  ).rejects.toMatchObject({ status: 409 });
  expect(state.rows.get("website_pages/about")?.version).toBe(1);
});
it("rejects guests, removed leaders, and forged duplicate-role accounts without writes", async () => {
  state.actor = null;
  await expect(changePage(request("save", 0, { copy }))).rejects.toMatchObject({
    status: 401,
  });
  state.actor = {
    uid: "leader",
    roles: ["coo"],
    displayName: "Leader",
    email: "leader@example.invalid",
  };
  state.rows.set("leadership_accounts/coo", { uid: "other" });
  await expect(changePage(request("save", 0, { copy }))).rejects.toMatchObject({
    status: 403,
  });
  expect(state.rows.has("website_pages/about")).toBe(false);
});
it("publishes only the approved projection fields", async () => {
  await changePage(request("save", 0, { copy }));
  await changePage(request("publish", 1));
  expect(Object.keys(state.rows.get("published_pages/about")!).sort()).toEqual([
    "copy",
    "publishedAt",
    "version",
  ]);
  expect(await publishedPage("about")).toEqual(copy);
});
it("rejects HTML, excess fields, empty/oversize input, unknown routes and invalid versions", () => {
  expect(() =>
    validateCopy({ ...copy, body: "<script>alert(1)</script>" }),
  ).toThrow();
  expect(() => validateCopy({ ...copy, privateNotes: "secret" })).toThrow();
  expect(() => validateCopy({ ...copy, body: "a".repeat(6001) })).toThrow();
  expect(() => validateCopy({ ...copy, title: " " })).toThrow();
  expect(() => pageSlug("portal")).toThrow();
  expect(() => expectedVersion(-1)).toThrow();
});
