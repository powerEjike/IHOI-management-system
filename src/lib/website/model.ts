import { isPageSlug, pages } from "@/lib/content";
import { ApiError } from "@/lib/http";
export type PageCopy = {
  title: string;
  description: string;
  heading: string;
  body: string;
};
export function pageSlug(value: unknown) {
  if (typeof value !== "string" || !isPageSlug(value))
    throw new ApiError(400, "invalid", "Choose an existing website page.");
  return value;
}
export function validateCopy(raw: unknown): PageCopy {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ApiError(400, "invalid", "Provide page copy.");
  const input = raw as Record<string, unknown>;
  const limits = { title: 140, description: 320, heading: 160, body: 6000 };
  if (Object.keys(input).some((k) => !Object.hasOwn(limits, k)))
    throw new ApiError(400, "invalid", "Unsupported page fields.");
  const result = {} as PageCopy;
  for (const [key, max] of Object.entries(limits)) {
    const value = input[key];
    if (typeof value !== "string" || !value.trim() || value.trim().length > max)
      throw new ApiError(
        400,
        "invalid",
        key + " is required and must be at most " + max + " characters.",
      );
    if (/[<>]/.test(value))
      throw new ApiError(400, "invalid", "Use plain text, without HTML tags.");
    result[key as keyof PageCopy] = value.trim();
  }
  return result;
}
export function initialCopy(slug: keyof typeof pages): PageCopy {
  const p = pages[slug];
  return {
    title: p.title,
    description: p.description,
    heading: p.emptyTitle,
    body: p.emptyText,
  };
}
export function expectedVersion(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new ApiError(400, "invalid", "Provide the current version.");
  return Number(value);
}
