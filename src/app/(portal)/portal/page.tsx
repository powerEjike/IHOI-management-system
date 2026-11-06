import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function PortalPage() {
  redirect((await getStaffSession()) ? "/portal/dashboard" : "/portal/login");
}
