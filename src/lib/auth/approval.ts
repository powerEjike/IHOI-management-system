import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { parseStaffRecord } from "./policy";

export async function readLeadershipApproval(uid: string) {
  const { db } = getFirebaseAdmin();
  const staff = parseStaffRecord(
    (await db.collection("staff_access").doc(uid).get()).data(),
  );
  if (!staff?.active) return null;
  const slot = await db
    .collection("leadership_accounts")
    .doc(staff.roles[0])
    .get();
  return slot.data()?.uid === uid ? staff : null;
}
