import { NextRequest } from "next/server";
import { readPrivateJson, apiJson, apiFailure } from "@/lib/http";
import { changePage } from "@/lib/website/service";
export async function POST(request: NextRequest) {
  try {
    return apiJson(await changePage(await readPrivateJson(request)));
  } catch (error) {
    return apiFailure(error);
  }
}
