import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDatabase } from "./db";
import { approvedAccess } from "./access-policy";
import { acceptEmployeeInvitation } from "./invitation-store";
import { isSuperAdminAccount } from "./super-admin-policy";

// Shared resolution lets the denial screen distinguish an unapproved account
// from an approved employee who opened an administrator-only route.
export async function getApprovedUser() {
  await auth.protect();
  const identity = await currentUser();
  if (!identity) redirect("/sign-in");
  let account = await getDatabase().appUser.findUnique({ where: { clerkUserId: identity.id } });
  const primaryEmail = identity.emailAddresses.find((email) => email.id === identity.primaryEmailAddressId);
  const profileName = [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim();
  if (!account && primaryEmail) account = await acceptEmployeeInvitation(getDatabase(), {
    id: identity.id, email: primaryEmail.emailAddress, verified: primaryEmail.verification?.status === "verified",
    banned: identity.banned, locked: identity.locked, invitationId: identity.publicMetadata.operationsInvitationId, name: profileName,
  });
  if (!approvedAccess(account, {
    id: identity.id,
    primaryEmail: primaryEmail?.emailAddress ?? null,
    emailVerified: primaryEmail?.verification?.status === "verified",
    banned: identity.banned,
    locked: identity.locked,
  }) || !account) return null;
  if (!account.displayName && profileName) await getDatabase().appUser.update({ where: { id: account.id }, data: { displayName: profileName } });
  return { id: account.id, role: account.role };
}

export async function requireApprovedUser() {
  const user = await getApprovedUser();
  if (!user) redirect("/access-denied");
  return user;
}

export async function requireAdmin() {
  const user = await requireApprovedUser();
  if (user.role !== "ADMIN") redirect("/access-denied?reason=admin");
  return user;
}

export async function approvedSuperAdmin(user: { id: string; role: string }) {
  if (user.role !== "ADMIN") return false;
  const account = await getDatabase().appUser.findUnique({ where: { id: user.id } });
  return !!account?.active && account.role === "ADMIN" && !account.loginDeletionRequestedAt && !account.loginDeletedAt && isSuperAdminAccount(account.email);
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (!await approvedSuperAdmin(user)) redirect("/administration");
  return user;
}
