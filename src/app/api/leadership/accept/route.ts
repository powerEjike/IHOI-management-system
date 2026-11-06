import { NextRequest } from "next/server";
import { apiFailure, apiJson, readPrivateJson } from "@/lib/http";
import { acceptLeadershipInvitation } from "@/lib/leadership/service";
export async function POST(request: NextRequest) {
  try {
    return apiJson(
      await acceptLeadershipInvitation(await readPrivateJson(request)),
    );
  } catch (error) {
    return apiFailure(error);
  }
}
