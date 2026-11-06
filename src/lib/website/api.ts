import { apiFailure, apiJson } from "@/lib/http";
import { ContentError } from "./schema";
export function websiteFailure(error: unknown) {
  return error instanceof ContentError
    ? apiJson({ message: error.message }, error.status)
    : apiFailure(error);
}
