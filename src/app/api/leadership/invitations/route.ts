import { NextRequest } from "next/server";
import { apiFailure, apiJson, readPrivateJson } from "@/lib/http";
import { createLeadershipInvitation } from "@/lib/leadership/service";
export async function POST(request: NextRequest) {
  try {
    return apiJson(
      await createLeadershipInvitation(await readPrivateJson(request)),
      201,
    );
  } catch (error) {
    return apiFailure(error);
  }
}
