type ApprovedAccount = { clerkUserId: string; email: string; active: boolean; role: "USER" | "ADMIN" };
type Identity = { id: string; primaryEmail: string | null; emailVerified: boolean; banned: boolean; locked: boolean };

export function approvedAccess(account: ApprovedAccount | null, identity: Identity) {
  return Boolean(account?.active && account.clerkUserId === identity.id &&
    identity.emailVerified && identity.primaryEmail?.toLowerCase() === account.email.toLowerCase() &&
    !identity.banned && !identity.locked);
}
