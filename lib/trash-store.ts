import { Prisma, PrismaClient } from "../generated/prisma/client";
import type { AttachmentStorage } from "./attachment-storage";
import { validAttachmentId } from "./attachment-policy";
import { terminalStatus } from "./order-status";

const retention = 30 * 24 * 60 * 60 * 1000;
async function lock(tx: Prisma.TransactionClient, id: string) {
  if (!validAttachmentId(id)) throw new Error("Invalid order.");
  await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${id}::uuid FOR UPDATE`;
  return tx.salesOrder.findUniqueOrThrow({ where: { id } });
}
async function actor(tx: Prisma.TransactionClient, id: string, admin = false) {
  const user = await tx.appUser.findUnique({ where: { id } });
  if (!user?.active || (admin && user.role !== "ADMIN")) throw new Error("Administrator access required.");
  return user;
}

export async function trashOrder(db: PrismaClient, actorId: string, id: string, terminalAdminOnly = false) {
  return db.$transaction(async tx => {
    const order = await lock(tx, id);
    const user = await actor(tx, actorId);
    if (terminalAdminOnly && terminalStatus((order.fields as Record<string, string>).status) && user.role !== "ADMIN") throw new Error("Only admins can delete completed orders from the list.");
    if (user.role !== "ADMIN" && order.creatorId !== actorId) throw new Error("Only the creator or an admin can delete this order.");
    if (order.deletedAt) return; // Repeated deletion must not extend retention.
    if (await tx.orderEmail.count({ where: { orderId: id, state: "SENDING", lastAttemptAt: { gt: new Date(Date.now() - 120_000) } } })) throw new Error("An SO email is being sent. Wait two minutes before deleting.");
    const now = new Date();
    await tx.salesOrder.update({ where: { id }, data: { deletedAt: now, deletedById: actorId, purgeAfter: new Date(now.getTime() + retention) } });
    await tx.orderEvent.create({ data: { orderId: id, actorId, changes: { event: "Order moved to Trash" } } });
  }, { timeout: 30_000 });
}

export async function restoreOrder(db: PrismaClient, actorId: string, id: string) {
  return db.$transaction(async tx => {
    const order = await lock(tx, id);
    await actor(tx, actorId, true);
    if (!order.deletedAt) return;
    if (!order.purgeAfter || order.purgeAfter <= new Date() || order.purgingAt || order.purgedAt) throw new Error("The restoration period has ended.");
    await tx.salesOrder.update({ where: { id }, data: { deletedAt: null, deletedById: null, purgeAfter: null } });
    await tx.orderEvent.create({ data: { orderId: id, actorId, changes: { event: "Order restored from Trash" } } });
  }, { timeout: 30_000 });
}

export async function listTrash(db: PrismaClient, actorId: string, page = 1) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) throw new Error("Invalid Trash page.");
  const user = await db.appUser.findUnique({ where: { id: actorId } });
  if (!user?.active || user.role !== "ADMIN") throw new Error("Administrator access required.");
  return db.salesOrder.findMany({ where: { deletedAt: { not: null }, purgedAt: null }, orderBy: [{ deletedAt: "desc" }, { id: "desc" }], skip: (page - 1) * 50, take: 50, include: { assignments: { include: { user: { select: { displayName: true, email: true, active: true } } } }, _count: { select: { attachments: { where: { state: "READY" } } } } } });
}

// Caller must be an authenticated admin, secret-authenticated scheduler, or guarded development CLI.
// Optional orderId scopes synthetic tests; expiration is always checked in the database.
export async function purgeExpiredOrders(db: PrismaClient, storage: AttachmentStorage, orderId?: string) {
  const deadline = Date.now() + 35_000;
  const due = await db.salesOrder.findMany({ where: { ...(orderId ? { id: orderId } : {}), deletedAt: { not: null }, purgeAfter: { lte: new Date() }, purgedAt: null }, select: { id: true }, take: 10, orderBy: { updatedAt: "asc" } });
  let purged = 0;
  for (const entry of due) {
    if (Date.now() >= deadline) break;
    try {
      const claimed = await db.$transaction(async tx => {
        const order = await lock(tx, entry.id);
        if (!order.deletedAt || !order.purgeAfter || order.purgeAfter > new Date() || order.purgedAt) return false;
        await tx.salesOrder.update({ where: { id: order.id }, data: { purgingAt: order.purgingAt ?? new Date() } });
        return true;
      });
      if (!claimed) continue;
      const files = await db.orderAttachment.findMany({ where: { orderId: entry.id } });
      for (const file of files) {
        if (Date.now() >= deadline) throw new Error("Continue cleanup on the next invocation.");
        // An upload URL must have expired before its staging key can be permanently removed.
        if (file.expiresAt > new Date()) throw new Error("An upload is still expiring.");
        if (!file.stagingCleanedAt) {
          await storage.remove(file.stagingKey);
          await db.orderAttachment.update({ where: { id: file.id }, data: { stagingCleanedAt: new Date() } });
        }
        if (!file.objectCleanedAt) {
          await storage.remove(file.storageKey);
          await db.orderAttachment.update({ where: { id: file.id }, data: { objectCleanedAt: new Date() } });
        }
      }
      await db.$transaction(async tx => {
        const order = await lock(tx, entry.id);
        if (order.purgedAt) return;
        if (!order.deletedAt || !order.purgingAt || !order.purgeAfter || order.purgeAfter > new Date()) throw new Error("Order is not eligible.");
        // File metadata survives every storage failure, so future attempts can retry all keys.
        await tx.orderAttachment.deleteMany({ where: { orderId: entry.id } });
        await tx.orderEmail.deleteMany({ where: { orderId: entry.id } });
        await tx.orderComment.deleteMany({ where: { orderId: entry.id } });
        await tx.notification.deleteMany({ where: { orderId: entry.id } });
        await tx.orderAssignment.deleteMany({ where: { orderId: entry.id } });
        await tx.orderItem.deleteMany({ where: { orderId: entry.id } });
        await tx.orderEvent.deleteMany({ where: { orderId: entry.id } });
        await tx.salesOrder.update({ where: { id: entry.id }, data: { name: null, fields: {}, purgedAt: new Date() } });
      }, { timeout: 20_000 });
      purged++;
    } catch { /* Durable purging state and file keys remain inaccessible and retryable. */ }
  }
  return { checked: due.length, purged };
}
