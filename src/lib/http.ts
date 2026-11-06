import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/policy";
import { parseSiteUrl } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};
export function apiJson(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: privateHeaders });
}
export async function readPrivateJson(
  request: NextRequest,
  maxBytes = 18000,
): Promise<Record<string, unknown>> {
  let origin = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)?.origin;
  if (!origin) {
    const host = request.headers.get("host");
    try {
      const url = new URL(
        `${request.nextUrl.protocol}//${host || request.nextUrl.host}`,
      );
      origin =
        !url.username && !url.password && (!host || url.host === host)
          ? url.origin
          : "";
    } catch {
      origin = "";
    }
  }
  if (!isSameOrigin(request.headers.get("origin"), origin))
    throw new ApiError(
      403,
      "forbidden",
      "This request must come from the ministry website.",
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new ApiError(415, "invalid", "Submit JSON data.");
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let text = "",
    bytes = 0;
  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > maxBytes) {
          await reader.cancel();
          throw new ApiError(
            413,
            "invalid",
            "The submitted data is too large.",
          );
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid", "Submit valid data.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError(400, "invalid", "Submit valid data.");
  return value as Record<string, unknown>;
}
export function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return apiJson({ code: error.code, message: error.message }, error.status);
  return apiJson(
    {
      code: "unavailable",
      message: "Unable to complete this request. Please try again.",
    },
    503,
  );
}
