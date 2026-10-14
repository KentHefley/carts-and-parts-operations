import { type PrismaClient, type Prisma } from "../generated/prisma/client";
import { invitationEmail, InvitationError } from "./invitation-policy";

export type RemoteInvitation = { id: string; emailAddress: string; status: string; publicMetadata: Record<string, unknown> | null };
export type InvitationProvider = {
  create(email: string, id: string): Promise<RemoteInvitation>;
  find(email: string, id: string): Promise<RemoteInvitation | null>;
  revoke(id: string): Promise<void>;
  accountExists(email: string): Promise<boolean>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function admin(tx: Prisma.TransactionClient, id: string) {
  const actor = await tx.appUser.findUnique({ where: { id } });
  if (!actor?.active || actor.role !== "ADMIN") throw new InvitationError("Administrator access required.");
}
async function locked<T>(db: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('user-access-management'))`;
    return work(tx);
  }, { maxWait: 10_000, timeout: 30_000 });
}
export async function sendEmployeeInvitation(db: PrismaClient, provider: InvitationProvider, actorId: string, input: { id: string; email: string }, allowed: string[]) {
  const email = invitationEmail(input.email);
  if (!uuid.test(input.id)) throw new InvitationError("Invalid invitation request.");
  if (!allowed.includes(email)) throw new InvitationError("This email is not on the development invitation allowlist. Add it to INVITATION_ALLOWED_RECIPIENTS in .env.local and restart the server.");
  const prepared = await locked(db, async tx => {
    await admin(tx, actorId);
    const retry = await tx.employeeInvitation.findUnique({ where: { id: input.id } });
    if (retry) {
      if (retry.email !== email || retry.actorId !== actorId) throw new InvitationError("Invitation request does not match.");
      if (["CANCELLED", "FAILED", "ACCEPTED"].includes(retry.state)) throw new InvitationError("This request is already closed. Start a new invitation or manage the existing employee.");
      return false;
    }
    if (await tx.appUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })) throw new InvitationError("This employee already has an account. Manage their access below.");
    if (await tx.employeeInvitation.findFirst({ where: { email, state: { in: ["SENDING", "SENT", "UNCERTAIN"] } } })) throw new InvitationError("An invitation already exists for this email. Review or cancel it below.");
    await tx.employeeInvitation.create({ data: { id: input.id, email, actorId, expiresAt: new Date(Date.now() + 30 * 86400000) } });
    await tx.invitationAudit.create({ data: { invitationId: input.id, actorId, action: "Send requested" } });
    return true;
  });
  if (!prepared) return;
  try {
    if (await provider.accountExists(email)) throw new InvitationError("This email already has a Clerk account. No invitation was sent; account approval requires separate review.");
    const remote = await provider.create(email, input.id);
    if (remote.emailAddress.toLowerCase() !== email || remote.publicMetadata?.operationsInvitationId !== input.id) throw new Error("Provider response mismatch");
    await locked(db, async tx => {
      const row = await tx.employeeInvitation.findUniqueOrThrow({ where: { id: input.id } });
      // Cancellation may have happened while Clerk was sending. Do not restore approval.
      await tx.employeeInvitation.update({ where: { id: row.id }, data: { providerId: remote.id, ...(row.state === "SENDING" ? { state: "SENT" } : {}) } });
      await tx.invitationAudit.create({ data: { invitationId: row.id, actorId, action: "Clerk accepted invitation request" } });
    });
  } catch (error) {
    await locked(db, async tx => {
      await tx.employeeInvitation.updateMany({ where: { id: input.id, state: "SENDING" }, data: { state: error instanceof InvitationError ? "FAILED" : "UNCERTAIN" } });
      await tx.invitationAudit.create({ data: { invitationId: input.id, actorId, action: error instanceof InvitationError ? "Send refused: existing Clerk account" : "Delivery outcome requires review" } });
    });
    throw error instanceof InvitationError ? error : new InvitationError("Clerk delivery could not be confirmed. Use Check Status before trying again; an email may already have been sent.");
  }
}
export async function manageEmployeeInvitation(db: PrismaClient, provider: InvitationProvider, actorId: string, id: string, cancel: boolean) {
  if (!uuid.test(id)) throw new InvitationError("Invalid invitation.");
  const invitation = await locked(db, async tx => {
    await admin(tx, actorId);
    const row = await tx.employeeInvitation.findUniqueOrThrow({ where: { id } });
    if (row.state === "ACCEPTED") throw new InvitationError("This employee has joined. Manage their access below.");
    if (cancel && row.state !== "CANCELLED") {
      await tx.employeeInvitation.update({ where: { id }, data: { state: "CANCELLED" } });
      await tx.invitationAudit.create({ data: { invitationId: id, actorId, action: "Cancelled app approval" } });
    }
    return row;
  });
  let remote: RemoteInvitation | null;
  try { remote = await provider.find(invitation.email, id); }
  catch { throw new InvitationError(cancel || invitation.state === "CANCELLED" ? "App approval is cancelled. Retry Cancellation to finish checking the Clerk link." : "Clerk status is unavailable. Try Check Status again."); }
  if (cancel || invitation.state === "CANCELLED") {
    if (remote?.status === "pending") {
      try { await provider.revoke(remote.id); }
      catch { throw new InvitationError("App approval is cancelled. Retry Cancellation to finish revoking the Clerk link."); }
    }
    return "Invitation cancelled. It can no longer approve app access.";
  }
  if (!remote) return "No matching Clerk invitation found. Cancel this request before creating a new one.";
  await locked(db, async tx => {
    await admin(tx, actorId);
    const row = await tx.employeeInvitation.findUniqueOrThrow({ where: { id } });
    if (["CANCELLED", "ACCEPTED"].includes(row.state)) return;
    const state = remote.status === "revoked" || remote.status === "expired" ? "CANCELLED" : "SENT";
    await tx.employeeInvitation.update({ where: { id }, data: { state, providerId: remote.id } });
    if (state !== row.state) await tx.invitationAudit.create({ data: { invitationId: id, actorId, action: `Clerk status reviewed: ${remote.status}` } });
  });
  return remote.status === "accepted" ? "Clerk invitation accepted. App access is created when the employee signs in." : `Clerk invitation status: ${remote.status}.`;
}

export async function acceptEmployeeInvitation(db: PrismaClient, identity: { id: string; email: string; verified: boolean; banned: boolean; locked: boolean; invitationId: unknown; name: string }) {
  if (!identity.verified || identity.banned || identity.locked || typeof identity.invitationId !== "string" || !uuid.test(identity.invitationId)) return null;
  const id = identity.invitationId;
  return locked(db, async tx => {
    const existing = await tx.appUser.findUnique({ where: { clerkUserId: identity.id } });
    if (existing) return existing; // Never reactivate or promote an existing account.
    const row = await tx.employeeInvitation.findUnique({ where: { id } });
    if (!row || !["SENDING", "SENT", "UNCERTAIN"].includes(row.state) || row.expiresAt <= new Date() || row.email !== identity.email.toLowerCase()) return null;
    if (await tx.appUser.findFirst({ where: { email: { equals: row.email, mode: "insensitive" } } })) return null;
    const user = await tx.appUser.create({ data: { clerkUserId: identity.id, email: row.email, displayName: identity.name.trim() || null, role: "USER", active: true } });
    await tx.employeeInvitation.update({ where: { id }, data: { state: "ACCEPTED", acceptedUserId: user.id } });
    await tx.invitationAudit.create({ data: { invitationId: id, actorId: user.id, action: "Accepted and provisioned User access" } });
    return user;
  });
}
