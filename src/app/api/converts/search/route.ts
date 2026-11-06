import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { listConverts } from "@/lib/converts/service";
import { convertFailure } from "@/lib/converts/api";
export async function POST(request: NextRequest) {
  try {
    return apiJson(await listConverts(await readPrivateJson(request)));
  } catch (error) {
    return convertFailure(error);
  }
}
