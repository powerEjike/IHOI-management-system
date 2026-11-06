import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { reviewEnquiry } from "@/lib/website/submissions";
import { websiteFailure } from "@/lib/website/api";
export async function POST(request: NextRequest) {
  try {
    return apiJson(await reviewEnquiry(await readPrivateJson(request)));
  } catch (e) {
    return websiteFailure(e);
  }
}
