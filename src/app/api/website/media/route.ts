import { NextRequest } from "next/server";
import { readPrivateJson, apiJson } from "@/lib/http";
import { uploadPhoto, withdrawPhoto, approvePhoto } from "@/lib/website/media";
import { contentActor } from "@/lib/website/service";
import { websiteFailure } from "@/lib/website/api";
export async function POST(request: NextRequest) {
  try {
    await contentActor();
    return apiJson(
      await uploadPhoto(await readPrivateJson(request, 2850000)),
      201,
    );
  } catch (e) {
    return websiteFailure(e);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const raw = await readPrivateJson(request);
    return apiJson(
      await (raw.action === "approve" ? approvePhoto(raw) : withdrawPhoto(raw)),
    );
  } catch (e) {
    return websiteFailure(e);
  }
}
