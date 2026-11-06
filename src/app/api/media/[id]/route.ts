import { NextRequest, NextResponse } from "next/server";
import { photoBytes } from "@/lib/website/media";
import { websiteFailure } from "@/lib/website/api";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return new NextResponse(
      new Uint8Array(await photoBytes((await params).id)),
      {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
        },
      },
    );
  } catch (e) {
    return websiteFailure(e);
  }
}
