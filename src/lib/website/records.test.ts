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
    return {
      exists: state.rows.has(path),
      data: () => state.rows.get(path),
      ref: ref(path),
      id: path.split("/").at(-1),
    };
  }
  const db = {
    getAll: async (...refs: any[]) => Promise.all(refs.map((r) => r.get())),
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
        update: (r: any, v: any) =>
          pending.push(() =>
            state.rows.set(r.path, { ...state.rows.get(r.path), ...v }),
          ),
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
import { changeRecord, publicRecord } from "./records";
import { newFields, validateFields, publicFields, safeLink } from "./schema";
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
  process.env.PUBLIC_FORM_RATE_LIMIT_SECRET =
    "unit-only-secret-at-least-32-characters";
  delete process.env.PUBLIC_FORM_PROXY_HEADER;
});

const id = "a".repeat(32);
const approved = {
  ...newFields("resources"),
  title: "A ministry message",
  summary: "A message introduction",
  body: "A message body",
  publicApproved: "yes",
  approvalSource: "Leadership approval fixture",
  approvalDate: "2026-01-01",
};
const req = (action: string, v: number, extra = {}) => ({
  kind: "resources",
  id,
  action,
  expectedVersion: v,
  requestId: crypto.randomUUID(),
  ...extra,
});
it("publishes an allowed projection and preserves it when editing or restoring drafts", async () => {
  await changeRecord(req("save", 0, { fields: approved }));
  expect(state.rows.has("website_public/resources/items/" + id)).toBe(false);
  await changeRecord(req("publish", 1));
  const pub = state.rows.get("website_public/resources/items/" + id)!;
  expect(pub.fields).not.toHaveProperty("approvalSource");
  await changeRecord(
    req("save", 2, {
      fields: { ...approved, title: "Unfinished private edit" },
    }),
  );
  expect(
    (state.rows.get("website_public/resources/items/" + id)!.fields as any)
      .title,
  ).toBe(approved.title);
  await changeRecord(req("restore", 3, { restoreVersion: 1 }));
  expect(
    state.rows.get("website_records/resources/items/" + id)?.publishedVersion,
  ).toBe(2);
  await changeRecord(req("unpublish", 4));
  expect(state.rows.has("website_public/resources/items/" + id)).toBe(false);
});
it("checks consent and media permission, and removes media references on archive", async () => {
  const image = "b".repeat(32);
  const fields = { ...approved, images: image };
  await changeRecord(req("save", 0, { fields }));
  await expect(changeRecord(req("publish", 1))).rejects.toMatchObject({
    status: 400,
  });
  state.rows.set("media_assets/" + image, {
    permission: "granted",
    alt: "Approved image",
    withdrawn: false,
  });
  await changeRecord(req("publish", 1));
  expect(
    state.rows.has(
      "media_assets/" + image + "/public_references/resources-" + id,
    ),
  ).toBe(true);
  await changeRecord(req("archive", 2));
  expect(
    state.rows.has(
      "media_assets/" + image + "/public_references/resources-" + id,
    ),
  ).toBe(false);
  expect(
    state.rows.has("website_records/resources/items/" + id + "/revisions/3"),
  ).toBe(true);
});
it("denies unauthorized/removed leaders and stale or changed retries without extra revisions", async () => {
  state.actor = null;
  await expect(
    changeRecord(req("save", 0, { fields: approved })),
  ).rejects.toMatchObject({ status: 401 });
  state.actor = {
    uid: "leader",
    roles: ["coo"],
    displayName: "Leader",
    email: "",
  };
  const body = req("save", 0, { fields: approved });
  await changeRecord(body);
  await changeRecord(body);
  expect(
    [...state.rows.keys()].filter((k) => k.startsWith("audit_logs/")),
  ).toHaveLength(1);
  await expect(
    changeRecord(req("save", 0, { fields: approved })),
  ).rejects.toMatchObject({ status: 409 });
  state.rows.set("leadership_accounts/coo", { uid: "other" });
  await expect(changeRecord(req("publish", 1))).rejects.toMatchObject({
    status: 403,
  });
});
it("requires publication approval, rejects HTML/unsafe links and validates events and forms readiness", () => {
  expect(() =>
    validateFields("resources", { ...approved, publicApproved: "no" }, true),
  ).toThrow();
  expect(() =>
    validateFields("resources", { ...approved, body: "<script>x</script>" }),
  ).toThrow();
  expect(safeLink("javascript:alert(1)")).toBe(false);
  expect(safeLink("https://user:pass@example.com")).toBe(false);
  expect(safeLink("https://example.com/message.pdf")).toBe(true);
  expect(() =>
    validateFields("events", {
      ...newFields("events"),
      title: "Event",
      summary: "Summary",
      body: "Description",
      start: "2026-04-31T15:00",
      location: "Venue",
    }),
  ).toThrow();
  expect(() =>
    validateFields(
      "settings",
      {
        ...newFields("settings"),
        formsEnabled: "yes",
        publicApproved: "yes",
        approvalSource: "Approved source",
        approvalDate: "2026-01-01",
      },
      true,
    ),
  ).toThrow();
  expect(publicFields("resources", approved)).not.toHaveProperty(
    "approvalDate",
  );
});

it("removes revoked photo descriptions as well as image links from public record responses", async () => {
  const image = "c".repeat(32);
  state.rows.set("media_assets/" + image, {
    permission: "granted",
    alt: "Private image description",
    withdrawn: false,
  });
  await changeRecord(
    req("save", 0, { fields: { ...approved, images: image } }),
  );
  await changeRecord(req("publish", 1));
  expect((await publicRecord("resources", id))!.media).toHaveLength(1);
  state.rows.set("media_assets/" + image, {
    permission: "granted",
    alt: "Private image description",
    withdrawn: true,
  });
  expect((await publicRecord("resources", id))!.media).toHaveLength(0);
});
