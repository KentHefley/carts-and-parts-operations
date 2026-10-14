type ApprovedAccount = { clerkUserId: string; email: string; active: boolean; role: "USER" | "ADMIN"; loginDeletionRequestedAt?: Date | null; loginDeletedAt?: Date | null };
type Identity = { id: string; primaryEmail: string | null; emailVerified: boolean; banned: boolean; locked: boolean };

export function approvedAccess(account: ApprovedAccount | null, identity: Identity) {
  return Boolean(account?.active && !account.loginDeletionRequestedAt && !account.loginDeletedAt && account.clerkUserId === identity.id &&
    identity.emailVerified && identity.primaryEmail?.toLowerCase() === account.email.toLowerCase() &&
    !identity.banned && !identity.locked);
}
