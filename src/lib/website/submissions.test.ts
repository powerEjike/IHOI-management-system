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
import { submitEnquiry, reviewEnquiry } from "./submissions";
import { validateSubmission } from "./submission-model";
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

const headers = new Headers();
const req = () => ({
  kind: "contact",
  requestId: crypto.randomUUID(),
  startedAt: Date.now() - 5000,
  website: "",
  name: "Fictional Visitor",
  email: "visitor@example.invalid",
  message: "This is a fictional enquiry.",
  phone: "",
  interest: "",
  availability: "",
  adult: false,
  consent: true,
});
const enable = () =>
  state.rows.set("website_public/settings/items/main", {
    version: 2,
    fields: {
      email: "ministry@example.invalid",
      privacyNotice: "Approved privacy notice ".repeat(10),
      formsEnabled: "yes",
    },
  });
it("rejects collection while forms are closed or privacy consent is absent", async () => {
  await expect(submitEnquiry(req(), headers)).rejects.toMatchObject({
    status: 503,
  });
  enable();
  await expect(
    submitEnquiry({ ...req(), consent: false }, headers),
  ).rejects.toMatchObject({ status: 400 });
  expect(
    [...state.rows.keys()].filter((k) => k.startsWith("website_submissions/")),
  ).toHaveLength(0);
});
it("stores enquiries once, binds consent to the published privacy version and limits abuse", async () => {
  enable();
  const body = req();
  await submitEnquiry(body, headers);
  await submitEnquiry(body, headers);
  expect(
    [...state.rows.keys()].filter((k) => k.startsWith("website_submissions/")),
  ).toHaveLength(1);
  const row = [...state.rows.entries()].find(([k]) =>
    k.startsWith("website_submissions/"),
  )![1];
  expect(row.privacyVersion).toBe(2);
  expect(row).not.toHaveProperty("ip");
  for (let i = 0; i < 4; i++) await submitEnquiry(req(), headers);
  await expect(submitEnquiry(req(), headers)).rejects.toMatchObject({
    status: 429,
  });
});
it("ignores honeypots and rejects quick or incomplete submissions and requires an age declaration", async () => {
  await expect(submitEnquiry({ website: "spam" }, headers)).resolves.toEqual({
    ok: true,
  });
  expect(() =>
    validateSubmission({ ...req(), startedAt: Date.now() }),
  ).toThrow();
  expect(() =>
    validateSubmission({
      ...req(),
      kind: "volunteer",
      interest: "Serving",
      availability: "Weekends",
      adult: undefined,
    }),
  ).toThrow();
});
it("limits inbox review to active leaders and rejects conflicting reviews", async () => {
  enable();
  await submitEnquiry(req(), headers);
  const key = [...state.rows.keys()].find((k) =>
    k.startsWith("website_submissions/"),
  )!;
  const id = key.split("/")[1];
  await reviewEnquiry({ id, status: "resolved", expectedRevision: 1 });
  expect(state.rows.get(key)?.status).toBe("resolved");
  await expect(
    reviewEnquiry({ id, status: "spam", expectedRevision: 1 }),
  ).rejects.toMatchObject({ status: 409 });
  state.actor = null;
  await expect(
    reviewEnquiry({ id, status: "new", expectedRevision: 2 }),
  ).rejects.toMatchObject({ status: 401 });
});

it("keeps under-18 volunteer applicants in safeguarding review without granting any account", async () => {
  enable();
  await submitEnquiry(
    {
      ...req(),
      kind: "volunteer",
      interest: "Serving",
      availability: "Weekends",
      adult: false,
    },
    headers,
  );
  const row = [...state.rows.entries()].find(([k]) =>
    k.startsWith("website_submissions/"),
  )![1];
  expect(row.status).toBe("safeguarding review");
  expect(row.adult).toBe(false);
  expect(
    [...state.rows.keys()].filter((k) => k.startsWith("staff_access/")),
  ).toHaveLength(1);
});
