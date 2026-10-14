import { type PrismaClient } from "../generated/prisma/client";
import { isSuperAdminAccount } from "./super-admin-policy";

export class AccessChangeError extends Error {}
export type AccessEdit = { id: string; expectedRole: "USER" | "ADMIN"; expectedActive: boolean; role: "USER" | "ADMIN"; active: boolean };

export async function saveUserAccess(db: PrismaClient, actorId: string, input: AccessEdit) {
  if (!input || !/^[0-9a-f-]{36}$/i.test(input.id) || !["USER", "ADMIN"].includes(input.role) || !["USER", "ADMIN"].includes(input.expectedRole) || typeof input.active !== "boolean" || typeof input.expectedActive !== "boolean") throw new AccessChangeError("Invalid access settings.");
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('user-access-management'))`;
    const actor = await tx.appUser.findUnique({ where: { id: actorId } });
    if (!actor?.active || actor.role !== "ADMIN") throw new AccessChangeError("Administrator access required.");
    const target = await tx.appUser.findUnique({ where: { id: input.id } });
    if (!target) throw new AccessChangeError("Employee account not found. Reload this page.");
    if (target.loginDeletionRequestedAt || target.loginDeletedAt) throw new AccessChangeError("This account is pending deletion or deleted. Its access cannot be changed here.");
    if (isSuperAdminAccount(target.email) && (input.role !== "ADMIN" || !input.active)) throw new AccessChangeError("This is the protected Super Admin account. Its administrator role and active access cannot be removed here.");
    if (target.role === input.role && target.active === input.active) return;
    if (target.role !== input.expectedRole || target.active !== input.expectedActive) throw new AccessChangeError("Access settings changed. Reload this page before saving again.");
    if (target.active && target.role === "ADMIN" && (!input.active || input.role !== "ADMIN") && await tx.appUser.count({ where: { active: true, role: "ADMIN" } }) <= 1) throw new AccessChangeError("Keep at least one active administrator. Promote another employee first.");
    await tx.appUser.update({ where: { id: target.id }, data: { role: input.role, active: input.active } });
    await tx.userAccessAudit.create({ data: { actorId, userId: target.id, changes: { employee: target.displayName || target.email, actor: actor.displayName || actor.email, before: { role: target.role, active: target.active }, after: { role: input.role, active: input.active } } } });
  }, { maxWait: 10_000, timeout: 30_000 });
}
