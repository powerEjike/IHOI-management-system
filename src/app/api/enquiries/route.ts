import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { submitEnquiry } from "@/lib/website/submissions";
import { websiteFailure } from "@/lib/website/api";
export async function POST(request: NextRequest) {
  try {
    return apiJson(
      await submitEnquiry(await readPrivateJson(request), request.headers),
      201,
    );
  } catch (e) {
    return websiteFailure(e);
  }
}
