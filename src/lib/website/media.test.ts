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
import sharp from "sharp";
import { mediaMetadata, uploadPhoto, withdrawPhoto } from "./media";
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

const info = {
  alt: "Fictional test pattern",
  source: "Test permission fixture",
  permissionDate: "2026-01-01",
  permission: "granted",
  containsMinors: false,
  guardianConsent: false,
};
it("requires guardian consent for identifiable minors and rejects future permission dates", () => {
  expect(() => mediaMetadata({ ...info, containsMinors: true })).toThrow();
  expect(() =>
    mediaMetadata({ ...info, permissionDate: "2099-01-01" }),
  ).toThrow();
  expect(
    mediaMetadata({ ...info, containsMinors: true, guardianConsent: true })
      .permission,
  ).toBe("granted");
});
it("optimizes actual image bytes, stores metadata separately and records withdrawal", async () => {
  const data = (
    await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#56394f" },
    })
      .png()
      .toBuffer()
  ).toString("base64");
  const { id } = await uploadPhoto({ ...info, data });
  const meta = state.rows.get("media_assets/" + id)!;
  expect(meta).not.toHaveProperty("bytes");
  expect(meta.byteLength).toBeLessThanOrEqual(200000);
  const image = state.rows.get("media_assets/" + id + "/image_data/image")!
    .bytes as Buffer;
  expect((await sharp(image).metadata()).format).toBe("webp");
  await withdrawPhoto({ id, reason: "Fixture consent withdrawn" });
  expect(state.rows.get("media_assets/" + id)?.withdrawn).toBe(true);
});
it("rejects executable/nonphoto content before creating media records", async () => {
  await expect(
    uploadPhoto({
      ...info,
      data: Buffer.from("<svg><script>bad()</script></svg>").toString("base64"),
    }),
  ).rejects.toMatchObject({ status: 400 });
  expect(
    [...state.rows.keys()].some((k) => k.startsWith("media_assets/")),
  ).toBe(false);
});
