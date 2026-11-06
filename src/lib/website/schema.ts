export class ContentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function websiteToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "date"
    | "datetime-local"
    | "number"
    | "email"
    | "url"
    | "select"
    | "images";
  required?: boolean;
  max?: number;
  options?: string[];
};
const common: Field[] = [
  { name: "title", label: "Title", required: true, max: 140 },
  { name: "summary", label: "Short introduction", required: true, max: 320 },
  {
    name: "body",
    label: "Full story / description",
    type: "textarea",
    required: true,
    max: 6000,
  },
];
const images: Field = {
  name: "images",
  label: "Photographs",
  type: "images",
  max: 500,
};
const approval: Field[] = [
  {
    name: "publicApproved",
    label: "Approved for public sharing",
    type: "select",
    options: ["no", "yes"],
  },
  { name: "approvalSource", label: "Approval source / reference", max: 300 },
  { name: "approvalDate", label: "Approval date", type: "date" },
];
export const catalogues = {
  leaders: {
    label: "Leadership",
    path: "about",
    singular: "Leader",
    fields: [
      { name: "role", label: "Ministry role", required: true, max: 100 },
      images,
    ],
  },
  resources: {
    label: "Resources",
    path: "resources",
    singular: "Resource",
    fields: [
      {
        name: "category",
        label: "Resource type",
        type: "select",
        options: [
          "Message",
          "Bible study",
          "Article",
          "Audio",
          "Video",
          "Download",
        ],
      },
      { name: "link", label: "HTTPS resource / download link", type: "url" },
      images,
    ],
  },
  projects: {
    label: "Projects",
    path: "projects",
    singular: "Project",
    fields: [
      {
        name: "progress",
        label: "Approved progress percentage (optional, 0–100)",
        type: "number",
        max: 3,
      },
      {
        name: "activityStatus",
        label: "Project status",
        type: "select",
        options: ["planned", "active", "completed", "on hold"],
      },
      images,
    ],
  },
  events: {
    label: "Events",
    path: "events",
    singular: "Event",
    fields: [
      {
        name: "start",
        label: "Starts (Africa/Lagos, UTC+1)",
        type: "datetime-local",
        required: true,
      },
      { name: "end", label: "Ends (Lagos time)", type: "datetime-local" },
      {
        name: "location",
        label: "Venue / meeting information",
        required: true,
        max: 300,
      },
      { name: "organizer", label: "Organizer", max: 160 },
      {
        name: "activityStatus",
        label: "Event status",
        type: "select",
        options: ["planned", "completed", "cancelled"],
      },
      images,
    ],
  },
  gallery: {
    label: "Gallery albums",
    path: "gallery",
    singular: "Album",
    fields: [{ name: "date", label: "Album date", type: "date" }, images],
  },
  outreach: {
    label: "Outreach stories",
    path: "outreach",
    singular: "Outreach",
    fields: [
      { name: "date", label: "Outreach date", type: "date" },
      { name: "location", label: "Community / location", max: 200 },
      images,
    ],
  },
  courses: {
    label: "Discipleship catalogue",
    path: "discipleship",
    singular: "Course",
    fields: [
      { name: "link", label: "HTTPS learning materials link", type: "url" },
      images,
    ],
  },
  testimonies: {
    label: "Testimonies",
    path: "testimonies",
    singular: "Testimony",
    fields: [images],
  },
} satisfies Record<
  string,
  { label: string; path: string; singular: string; fields: Field[] }
>;
export type Catalogue = keyof typeof catalogues;
export type ContentKind = Catalogue | "settings";
export const settingsFields: Field[] = [
  { name: "title", label: "Website setup label", required: true, max: 140 },
  { name: "email", label: "Public ministry email", type: "email", max: 160 },
  { name: "phone", label: "Public ministry phone", max: 60 },
  { name: "address", label: "Public location / address", max: 400 },
  {
    name: "serviceTimes",
    label: "Meeting / service information",
    type: "textarea",
    max: 1200,
  },
  { name: "facebook", label: "Facebook link", type: "url" },
  { name: "instagram", label: "Instagram link", type: "url" },
  { name: "youtube", label: "YouTube channel", type: "url" },
  {
    name: "privacyNotice",
    label: "Approved privacy notice",
    type: "textarea",
    max: 6000,
  },
  {
    name: "formsEnabled",
    label: "Open contact, partnership and volunteer forms",
    type: "select",
    options: ["no", "yes"],
  },
  ...approval,
];
export function contentKind(value: unknown): ContentKind {
  if (
    value === "settings" ||
    (typeof value === "string" && Object.hasOwn(catalogues, value))
  )
    return value as ContentKind;
  throw new ContentError(400, "Choose a valid content collection.");
}
export function fieldsFor(kind: ContentKind): Field[] {
  return kind === "settings"
    ? settingsFields
    : [...common, ...catalogues[kind].fields, ...approval];
}
export function newFields(kind: ContentKind): Record<string, string> {
  return Object.fromEntries(
    fieldsFor(kind).map((f) => [
      f.name,
      f.type === "select"
        ? f.options![0]
        : f.name === "title" && kind === "settings"
          ? "Ministry website settings"
          : "",
    ]),
  );
}
export function validContentId(value: unknown) {
  if (typeof value !== "string" || !/^([a-f0-9]{32}|main)$/.test(value))
    throw new ContentError(400, "Invalid content ID.");
  return value;
}
export function safeLink(value: string) {
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      !u.hostname.includes(".") ||
      /^(localhost|(?:\d+\.){3}\d+$|\[)/.test(u.hostname) ||
      u.hostname.endsWith(".local") ||
      u.hostname.endsWith(".internal")
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
export function imageIds(value: string) {
  const ids = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (
    ids.length > 12 ||
    new Set(ids).size !== ids.length ||
    ids.some((v) => !/^[a-f0-9]{32}$/.test(v))
  )
    throw new ContentError(400, "Choose up to 12 different library photos.");
  return ids;
}
export function validateFields(
  kind: ContentKind,
  raw: unknown,
  publishing = false,
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ContentError(400, "Provide content fields.");
  const values = raw as Record<string, unknown>,
    fields = fieldsFor(kind),
    allowed = fields.map((f) => f.name);
  if (Object.keys(values).some((k) => !allowed.includes(k)))
    throw new ContentError(400, "Unsupported content fields.");
  const output: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.name] ?? "";
    if (
      typeof v !== "string" ||
      v.trim().length > (f.max || 1000) ||
      (f.required && !v.trim())
    )
      throw new ContentError(400, f.label + " is missing or too long.");
    const text = v.trim();
    if (/[<>]/.test(text))
      throw new ContentError(
        400,
        "HTML is not allowed. Use the supported text formatting.",
      );
    if (f.type === "select" && !f.options?.includes(text))
      throw new ContentError(400, "Choose " + f.label.toLowerCase() + ".");
    if (f.type === "url" && text && !safeLink(text))
      throw new ContentError(400, "Links must be public HTTPS addresses.");
    if (f.type === "email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
      throw new ContentError(400, "Enter a valid email address.");
    if (
      f.type === "number" &&
      text &&
      (!/^\d{1,3}$/.test(text) || Number(text) > 100)
    )
      throw new ContentError(400, "Progress must be between 0 and 100.");
    if (f.type === "images") imageIds(text);
    if ((f.type === "date" || f.type === "datetime-local") && text) {
      const date = text.slice(0, 10);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        (f.type === "datetime-local" &&
          (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) ||
            !Number.isFinite(Date.parse(text + "+01:00"))))
      )
        throw new ContentError(
          400,
          "Enter a valid " + f.label.toLowerCase() + ".",
        );
    }
    output[f.name] = text;
  }
  if (output.start && output.end && output.end < output.start)
    throw new ContentError(400, "The event end must follow its start.");
  if (publishing) {
    if (
      output.publicApproved !== "yes" ||
      (output.approvalSource || "").length < 5 ||
      !output.approvalDate ||
      output.approvalDate > websiteToday()
    )
      throw new ContentError(
        400,
        "Record publication approval, its source and date before publishing.",
      );
    if (kind === "gallery" && !imageIds(output.images).length)
      throw new ContentError(
        400,
        "Choose at least one approved photo for this album.",
      );
    if (
      kind === "settings" &&
      output.formsEnabled === "yes" &&
      (!output.email || output.privacyNotice.length < 80)
    )
      throw new ContentError(
        400,
        "An approved ministry email and privacy notice of at least 80 characters are required to open forms.",
      );
  }
  return output;
}
export function publicFields(
  kind: ContentKind,
  fields: Record<string, string>,
) {
  const {
    publicApproved: _,
    approvalSource: __,
    approvalDate: ___,
    ...data
  } = validateFields(kind, fields, true);
  return data;
}
export function localDate(value: string) {
  if (!value) return "";
  const date = new Date(
    value.length === 16 ? value + "+01:00" : value + "T12:00:00+01:00",
  );
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "long",
    ...(value.length === 16 ? { timeStyle: "short" } : {}),
  });
}
