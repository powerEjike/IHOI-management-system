export const stages = ["convert", "disciple", "worker"] as const;
export const permissions = ["unknown", "granted", "declined"] as const;
export type MinistryStage = (typeof stages)[number];
export type ContactPermission = (typeof permissions)[number];
export type LeadershipRole = "super_admin" | "president" | "coo";
export type ConvertInput = {
  fullName: string;
  phone: string;
  email: string;
  location: string;
  registeredDate: string;
  stage: MinistryStage;
  contactPermission: ContactPermission;
  consentSource: string;
  consentDate: string;
  noContactReason: string;
  assignedLeaderRole: LeadershipRole | "";
  notes: string;
};
export type ConvertRecord = ConvertInput & {
  id: string;
  archived: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type ConvertSummary = Omit<
  ConvertRecord,
  "notes" | "consentSource" | "noContactReason"
>;
export type Duplicate = { id: string; fullName: string; archived: boolean };
export type ConvertList = {
  records: ConvertSummary[];
  nextCursor: string | null;
};
export class ConvertError extends Error {
  constructor(
    public code:
      | "invalid"
      | "unauthorized"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "duplicate",
    message: string,
    public details?: Record<string, string> | Duplicate[],
  ) {
    super(message);
  }
}

export function ministryToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}@.+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}
export function normalizeSearch(value: string) {
  return /^[+\d\s()-]+$/.test(value)
    ? normalizePhone(value)
    : normalizeText(value);
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
const limits = {
  fullName: 120,
  phone: 30,
  email: 254,
  location: 160,
  registeredDate: 10,
  stage: 10,
  contactPermission: 10,
  consentSource: 300,
  consentDate: 10,
  noContactReason: 300,
  assignedLeaderRole: 20,
  notes: 3000,
} as const;
export function validateConvert(
  raw: unknown,
  today = ministryToday(),
): ConvertInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ConvertError("invalid", "Enter valid convert details.");
  const object = raw as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const result = {} as Record<keyof typeof limits, string>;
  for (const [key, max] of Object.entries(limits)) {
    const value = object[key];
    if (typeof value !== "string" || value.trim().length > max)
      fields[key] = `Enter text of no more than ${max} characters.`;
    result[key as keyof typeof limits] =
      typeof value === "string" ? value.trim() : "";
  }
  if (Object.keys(object).some((key) => !(key in limits)))
    fields.form = "Unexpected fields were submitted. Reload this form.";
  if (!result.fullName) fields.fullName = "Enter the full name.";
  if (result.phone && !/^[+\d\s().-]+$/.test(result.phone))
    fields.phone = "Use a valid phone number.";
  if (result.phone && !/^\d{7,15}$/.test(normalizePhone(result.phone)))
    fields.phone =
      "Use 7–15 digits, including the country code where available.";
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
    fields.email = "Enter a valid email address.";
  if (!result.phone && !result.email && result.noContactReason.length < 5)
    fields.noContactReason = "Explain why no contact details are available.";
  if (!validDate(result.registeredDate) || result.registeredDate > today)
    fields.registeredDate = "Choose a real date no later than today.";
  if (!(stages as readonly string[]).includes(result.stage))
    fields.stage = "Choose a valid ministry stage.";
  if (!(permissions as readonly string[]).includes(result.contactPermission))
    fields.contactPermission = "Choose a valid contact permission.";
  if (result.contactPermission !== "unknown") {
    if (result.consentSource.length < 3)
      fields.consentSource = "Record how this permission was confirmed.";
    if (!validDate(result.consentDate) || result.consentDate > today)
      fields.consentDate = "Record a real permission date no later than today.";
  } else {
    result.consentSource = "";
    result.consentDate = "";
  }
  if (
    !["", "super_admin", "president", "coo"].includes(result.assignedLeaderRole)
  )
    fields.assignedLeaderRole = "Choose a leadership account or unassigned.";
  if (Object.keys(fields).length)
    throw new ConvertError("invalid", "Review the highlighted fields.", fields);
  if (result.phone || result.email) result.noContactReason = "";
  result.email = result.email.toLowerCase();
  return result as ConvertInput;
}

export function searchKeys(input: ConvertInput) {
  const keys = new Set<string>();
  const values = [
    normalizeText(input.fullName),
    ...normalizeText(input.fullName).split(" "),
    normalizePhone(input.phone),
    normalizeText(input.email),
  ];
  for (const value of values)
    for (let length = 2; length <= Math.min(value.length, 80); length++)
      keys.add(value.slice(0, length));
  return [...keys].slice(0, 300);
}
export function matchKeys(input: ConvertInput) {
  const words = normalizeText(input.fullName)
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(" ")
    .filter(Boolean)
    .sort();
  return [
    `name:${words.join(" ")}`,
    `similar:${words.map((word) => word.slice(0, 4)).join(" ")}`,
    ...(input.phone ? [`phone:${normalizePhone(input.phone)}`] : []),
    ...(input.email ? [`email:${input.email.toLowerCase()}`] : []),
  ];
}
export function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}
export function validRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9-]{36}$/.test(value);
}
