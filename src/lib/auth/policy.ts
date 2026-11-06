export const staffRoles = [
  "super_admin",
  "church_admin",
  "evangelism_coordinator",
  "secretary",
  "follow_up_worker",
  "content_editor",
] as const;
export type StaffRole = (typeof staffRoles)[number];
export const roleLabels: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  church_admin: "Church Admin",
  evangelism_coordinator: "Evangelism Coordinator",
  secretary: "Secretary",
  follow_up_worker: "Follow-Up Worker",
  content_editor: "Content Editor",
};
export type StaffRecord = {
  displayName: string;
  active: boolean;
  roles: StaffRole[];
};
export const SESSION_COOKIE = "ihoi_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function parseStaffRecord(data: unknown): StaffRecord | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  if (
    typeof value.displayName !== "string" ||
    value.displayName.trim().length === 0 ||
    value.displayName.length > 120 ||
    typeof value.active !== "boolean" ||
    !Array.isArray(value.roles) ||
    value.roles.length < 1 ||
    value.roles.length > staffRoles.length ||
    !value.roles.every(
      (role) =>
        typeof role === "string" &&
        (staffRoles as readonly string[]).includes(role),
    ) ||
    new Set(value.roles).size !== value.roles.length
  )
    return null;
  return {
    displayName: value.displayName.trim(),
    active: value.active,
    roles: value.roles as StaffRole[],
  };
}

export function requiresMfa(roles: readonly StaffRole[]): boolean {
  return roles.some((role) =>
    ["super_admin", "church_admin", "evangelism_coordinator"].includes(role),
  );
}

export function hasAnyRole(
  roles: readonly StaffRole[],
  allowed: readonly StaffRole[],
): boolean {
  return allowed.length > 0 && roles.some((role) => allowed.includes(role));
}

export function isSameOrigin(
  origin: string | null,
  expectedOrigin: string,
): boolean {
  if (!origin) return false;
  try {
    return (
      new URL(origin).origin === expectedOrigin &&
      new URL(origin).href === new URL(origin).origin + "/"
    );
  } catch {
    return false;
  }
}

export type AccessDecision =
  "allowed" | "unverified" | "unapproved" | "mfa_required";
export function decideStaffAccess({
  staff,
  emailVerified,
  secondFactor,
  hasEnrolledFactor,
}: {
  staff: StaffRecord | null;
  emailVerified: boolean;
  secondFactor: boolean;
  hasEnrolledFactor: boolean;
}): AccessDecision {
  if (!emailVerified) return "unverified";
  if (!staff?.active) return "unapproved";
  if (
    (requiresMfa(staff.roles) || hasEnrolledFactor) &&
    (!secondFactor || !hasEnrolledFactor)
  )
    return "mfa_required";
  return "allowed";
}
