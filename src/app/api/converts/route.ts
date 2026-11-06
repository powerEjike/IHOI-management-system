import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { saveConvert } from "@/lib/converts/service";
import { convertFailure } from "@/lib/converts/api";
export async function POST(request: NextRequest) {
  try {
    return apiJson(await saveConvert(await readPrivateJson(request)), 201);
  } catch (error) {
    return convertFailure(error);
  }
}
