import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { archiveConvert } from "@/lib/converts/service";
import { convertFailure } from "@/lib/converts/api";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return apiJson(await archiveConvert(id, await readPrivateJson(request)));
  } catch (error) {
    return convertFailure(error);
  }
}
