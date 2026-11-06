import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getFirebaseAdmin,
  isFirebaseServerConfigured,
} from "@/lib/firebase/admin";
import {
  decideStaffAccess,
  hasAnyRole,
  parseStaffRecord,
  SESSION_COOKIE,
  type StaffRole,
} from "./policy";

export async function getStaffSession() {
  if (!isFirebaseServerConfigured()) return null;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const { auth, db } = getFirebaseAdmin();
    const token = await auth.verifySessionCookie(value, true);
    const [user, record] = await Promise.all([
      auth.getUser(token.uid),
      db.collection("staff_access").doc(token.uid).get(),
    ]);
    const staff = parseStaffRecord(record.data());
    if (
      user.disabled ||
      decideStaffAccess({
        staff,
        emailVerified: user.emailVerified,
        secondFactor: token.firebase?.sign_in_second_factor === "totp",
        hasEnrolledFactor: Boolean(user.multiFactor?.enrolledFactors?.length),
      }) !== "allowed" ||
      !staff
    )
      return null;
    return { uid: user.uid, email: user.email || "", ...staff };
  } catch {
    return null;
  }
}

// Invoke at every private data operation, not only at the layout boundary.
export async function requireStaff(allowed?: readonly StaffRole[]) {
  const session = await getStaffSession();
  if (!session) redirect("/portal/login");
  if (allowed && !hasAnyRole(session.roles, allowed))
    redirect("/portal/forbidden");
  return session;
}
