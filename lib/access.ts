import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDatabase } from "./db";
import { approvedAccess } from "./access-policy";

export async function requireApprovedUser() {
  await auth.protect();
  const identity = await currentUser();
  if (!identity) redirect("/sign-in");
  const account = await getDatabase().appUser.findUnique({ where: { clerkUserId: identity.id } });
  const primaryEmail = identity.emailAddresses.find((email) => email.id === identity.primaryEmailAddressId);
  if (!approvedAccess(account, {
    id: identity.id,
    primaryEmail: primaryEmail?.emailAddress ?? null,
    emailVerified: primaryEmail?.verification?.status === "verified",
    banned: identity.banned,
    locked: identity.locked,
  }) || !account) redirect("/access-denied");
  const profileName = [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim();
  if (!account.displayName && profileName) await getDatabase().appUser.update({ where: { id: account.id }, data: { displayName: profileName } });
  return { id: account.id, role: account.role };
}

export async function requireAdmin() {
  const user = await requireApprovedUser();
  if (user.role !== "ADMIN") redirect("/access-denied");
  return user;
}
