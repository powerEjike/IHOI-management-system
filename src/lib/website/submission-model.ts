import { ContentError } from "./schema";
export const submissionKinds = ["contact", "partnership", "volunteer"] as const;
export type SubmissionKind = (typeof submissionKinds)[number];
export function validateSubmission(raw: Record<string, unknown>) {
  if (
    !submissionKinds.includes(raw.kind as SubmissionKind) ||
    typeof raw.requestId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(raw.requestId) ||
    typeof raw.startedAt !== "number" ||
    Date.now() - raw.startedAt < 3000 ||
    Date.now() - raw.startedAt > 86400000
  )
    throw new ContentError(400, "Please complete the form and try again.");
  if (
    Object.keys(raw).some(
      (k) =>
        ![
          "kind",
          "requestId",
          "startedAt",
          "website",
          "name",
          "email",
          "phone",
          "message",
          "interest",
          "availability",
          "consent",
          "adult",
        ].includes(k),
    )
  )
    throw new ContentError(400, "Unsupported submission fields.");
  const output: Record<string, string> = {};
  for (const [key, max] of Object.entries({
    name: 120,
    email: 160,
    phone: 60,
    message: 3000,
    interest: 160,
    availability: 500,
  })) {
    const value = raw[key] ?? "";
    if (
      typeof value !== "string" ||
      value.trim().length > max ||
      /[<>]/.test(value)
    )
      throw new ContentError(400, "Please check " + key + ".");
    output[key] = value.trim();
  }
  if (
    output.name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email) ||
    output.message.length < 10 ||
    raw.consent !== true
  )
    throw new ContentError(
      400,
      "Provide your name, email, message and consent.",
    );
  if (
    raw.kind === "volunteer" &&
    (typeof raw.adult !== "boolean" || !output.interest || !output.availability)
  )
    throw new ContentError(
      400,
      "Provide your age declaration, interests and availability.",
    );
  if (
    raw.kind === "partnership" &&
    !["Pray", "Give", "Volunteer", "Go"].includes(output.interest)
  )
    throw new ContentError(400, "Choose how you would like to partner.");
  return {
    kind: raw.kind as SubmissionKind,
    requestId: raw.requestId,
    fields: output,
    adult: raw.adult === true,
  };
}
