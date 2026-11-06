import { NextRequest, NextResponse } from "next/server";
import {
  getFirebaseAdmin,
  isFirebaseServerConfigured,
} from "@/lib/firebase/admin";
import {
  decideStaffAccess,
  isSameOrigin,
  parseStaffRecord,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
} from "@/lib/auth/policy";
import { parseSiteUrl } from "@/lib/config";
import { readLeadershipApproval } from "@/lib/auth/approval";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0" };
function response(code: string, status: number) {
  return NextResponse.json({ code }, { status, headers });
}

function expectedOrigin(request: NextRequest): string {
  const configured = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)?.origin;
  if (configured) return configured;
  // NextURL normalizes loopback IPs to localhost. Preserve the actual Host
  // header so the browser's exact origin remains valid during local preview.
  const host = request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  try {
    const url = new URL(`${request.nextUrl.protocol}//${host}`);
    return url.host === host && !url.username && !url.password
      ? url.origin
      : "";
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  const expected = expectedOrigin(request);
  if (!isSameOrigin(request.headers.get("origin"), expected))
    return response("forbidden", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return response("invalid_request", 415);
  if (!isFirebaseServerConfigured()) return response("not_configured", 503);
  const raw = await request.text();
  if (raw.length > 12000) return response("invalid_request", 413);
  let idToken: unknown;
  try {
    idToken = (JSON.parse(raw) as Record<string, unknown>).idToken;
  } catch {
    return response("invalid_request", 400);
  }
  if (
    typeof idToken !== "string" ||
    idToken.length < 20 ||
    idToken.length > 10000
  )
    return response("invalid_request", 400);
  try {
    const { auth } = getFirebaseAdmin();
    const token = await auth.verifyIdToken(idToken, true);
    const age = Date.now() / 1000 - token.auth_time;
    if (age < -30 || age > 300) return response("recent_login_required", 401);
    const [user, staff] = await Promise.all([
      auth.getUser(token.uid),
      readLeadershipApproval(token.uid),
    ]);
    if (user.disabled) return response("unapproved", 403);
    const decision = decideStaffAccess({
      staff,
      emailVerified: user.emailVerified,
      secondFactor: token.firebase?.sign_in_second_factor === "totp",
      hasEnrolledFactor: Boolean(user.multiFactor?.enrolledFactors?.length),
    });
    if (decision !== "allowed") return response(decision, 403);
    const session = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });
    const result = response("signed_in", 200);
    result.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });
    return result;
  } catch {
    return response("sign_in_failed", 401);
  }
}

export async function DELETE(request: NextRequest) {
  const expected = expectedOrigin(request);
  if (!isSameOrigin(request.headers.get("origin"), expected))
    return response("forbidden", 403);
  const result = response("signed_out", 200);
  result.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return result;
}
