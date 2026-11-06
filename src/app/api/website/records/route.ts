import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { changeRecord } from "@/lib/website/records";
import { websiteFailure } from "@/lib/website/api";
export async function POST(request: NextRequest) {
  try {
    return apiJson(await changeRecord(await readPrivateJson(request)));
  } catch (error) {
    return websiteFailure(error);
  }
}
