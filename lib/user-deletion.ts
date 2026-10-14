import { type PrismaClient, type Prisma } from "../generated/prisma/client";
import { isSuperAdminAccount } from "./super-admin-policy";
import { AccessChangeError } from "./user-management";

export type LoginDeletionProvider = { remove(clerkUserId: string): Promise<void> };
async function superAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const actor = await tx.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.role !== "ADMIN" || actor.loginDeletionRequestedAt || actor.loginDeletedAt || !isSuperAdminAccount(actor.email)) throw new AccessChangeError("Only the Super Admin can delete user accounts.");
  return actor;
}
function locked<T>(db: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('user-access-management'))`;
    return work(tx);
  }, { maxWait: 10_000, timeout: 30_000 });
}
export async function deleteUserLogin(db: PrismaClient, provider: LoginDeletionProvider, actorId: string, input: { id: string; expectedUpdatedAt: string }) {
  if (!input || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id) || typeof input.expectedUpdatedAt !== "string") throw new AccessChangeError("Invalid user deletion request.");
  const target = await locked(db, async tx => {
    const actor = await superAdmin(tx, actorId);
    const user = await tx.appUser.findUnique({ where: { id: input.id } });
    if (!user) throw new AccessChangeError("Employee account not found. Reload this page.");
    if (isSuperAdminAccount(user.email) || user.id === actorId) throw new AccessChangeError("The Super Admin account cannot be deleted.");
    if (user.loginDeletedAt) return user;
    if (!user.loginDeletionRequestedAt) {
      if (user.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new AccessChangeError("This account changed. Reload and review it before deleting.");
      await tx.appUser.update({ where: { id: user.id }, data: { active: false, loginDeletionRequestedAt: new Date() } });
      await tx.userAccessAudit.create({ data: { actorId, userId: user.id, changes: { actor: actor.displayName || actor.email, employee: user.displayName || user.email, action: "User login deletion requested", before: { role: user.role, active: user.active }, after: { role: user.role, active: false } } } });
    }
    return user;
  });
  if (target.loginDeletedAt) return;
  try { await provider.remove(target.clerkUserId); }
  catch {
    await locked(db, async tx => {
      const actor = await superAdmin(tx, actorId);
      await tx.userAccessAudit.create({ data: { actorId, userId: target.id, changes: { actor: actor.displayName || actor.email, employee: target.displayName || target.email, action: "Login deletion unconfirmed; retry required", before: { role: target.role, active: false }, after: { role: target.role, active: false } } } });
    });
    throw new AccessChangeError("App access is blocked, but login deletion could not be confirmed. Use Retry User Deletion to finish. Orders and history are preserved.");
  }
  await locked(db, async tx => {
    const actor = await superAdmin(tx, actorId);
    const current = await tx.appUser.findUniqueOrThrow({ where: { id: input.id } });
    if (current.loginDeletedAt) return;
    await tx.appUser.update({ where: { id: current.id }, data: { active: false, loginDeletedAt: new Date() } });
    await tx.userAccessAudit.create({ data: { actorId, userId: current.id, changes: { actor: actor.displayName || actor.email, employee: current.displayName || current.email, action: "User login permanently deleted; company history retained", before: { role: current.role, active: false }, after: { role: current.role, active: false } } } });
  });
}
