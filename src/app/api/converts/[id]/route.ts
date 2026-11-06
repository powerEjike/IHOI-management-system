import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { saveConvert } from "@/lib/converts/service";
import { convertFailure } from "@/lib/converts/api";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return apiJson(await saveConvert(await readPrivateJson(request), id));
  } catch (error) {
    return convertFailure(error);
  }
}
