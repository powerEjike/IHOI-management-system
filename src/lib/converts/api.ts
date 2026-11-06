import { ConvertError } from "./model";
import { apiFailure, apiJson } from "@/lib/http";
export function convertFailure(error: unknown) {
  if (error && typeof error === "object" && "code" in error && error.code === 9)
    return apiJson(
      {
        code: "preparing",
        message:
          "This data view is still being prepared. Please retry shortly.",
      },
      503,
    );
  if (!(error instanceof ConvertError)) return apiFailure(error);
  const status = {
    invalid: 400,
    unauthorized: 401,
    forbidden: 403,
    not_found: 404,
    conflict: 409,
    duplicate: 409,
  }[error.code];
  return apiJson(
    { code: error.code, message: error.message, details: error.details },
    status,
  );
}
