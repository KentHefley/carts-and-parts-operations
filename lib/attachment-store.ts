import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { attachmentInput, canManageAttachments, fileSignature, validAttachmentId } from "./attachment-policy";
import type { AttachmentStorage } from "./attachment-storage";
import { notifyOrderChange } from "./notification-store";

async function access(tx: Prisma.TransactionClient, orderId: string, actorId: string, write = false) {
  if (!validAttachmentId(orderId) || !validAttachmentId(actorId)) throw new Error("Invalid order or account.");
  await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${orderId}::uuid FOR UPDATE`;
  const order = await tx.salesOrder.findFirst({ where: { id: orderId, deletedAt: null }, select: { name: true } });
  const actor = await tx.appUser.findUnique({ where: { id: actorId }, select: { active: true, role: true } });
  if (!order || !actor?.active) throw new Error("Order access is unavailable.");
  if (write) {
    const assigned = !!await tx.orderAssignment.findUnique({ where: { orderId_userId: { orderId, userId: actorId } } });
    if (!canManageAttachments(actor.active, actor.role, assigned)) throw new Error("Only assigned employees and admins can add or delete files.");
    if (!order.name?.trim()) throw new Error("Save the order Name before adding files.");
  }
}
export async function beginAttachment(db: PrismaClient, storage: AttachmentStorage, actorId: string, orderId: string, requestKey: string, filename: unknown, size: unknown) {
  if (!validAttachmentId(requestKey)) throw new Error("Invalid upload request.");
  const input = attachmentInput(filename, size);
  const row = await db.$transaction(async tx => {
    await access(tx, orderId, actorId, true);
    const previous = await tx.orderAttachment.findUnique({ where: { orderId_uploaderId_requestKey: { orderId, uploaderId: actorId, requestKey } } });
    if (previous) {
      if (previous.filename !== input.filename || previous.size !== input.size || previous.state !== "PENDING" || previous.expiresAt <= new Date()) throw new Error("Start a new upload attempt.");
      return previous;
    }
    const id = randomUUID();
    return tx.orderAttachment.create({ data: { id, orderId, uploaderId: actorId, requestKey, ...input, stagingKey: `development/staging/${id}`, storageKey: `development/orders/${orderId}/${id}`, expiresAt: new Date(Date.now() + 15 * 60_000) } });
  });
  const remaining = Math.floor((row.expiresAt.getTime() - Date.now()) / 1000) - 60;
  if (remaining < 1) throw new Error("Upload expired. Start a new attempt.");
  return { id: row.id, url: await storage.upload(row.stagingKey, row.contentType, row.size, Math.min(600, remaining)), contentType: row.contentType };
}
export async function finishAttachment(db: PrismaClient, storage: AttachmentStorage, actorId: string, orderId: string, id: string) {
  if (!validAttachmentId(id)) throw new Error("Invalid file.");
  return db.$transaction(async tx => {
    await access(tx, orderId, actorId, true);
    const row = await tx.orderAttachment.findFirst({ where: { id, orderId, uploaderId: actorId } });
    if (!row) throw new Error("Upload not found.");
    if (row.state === "READY") return;
    if (row.state !== "PENDING" || row.expiresAt <= new Date()) throw new Error("Upload expired. Please upload again.");
    const object = await storage.inspect(row.stagingKey);
    if (object.size !== row.size || object.type !== row.contentType || !object.etag || !fileSignature(object.bytes, row.contentType)) throw new Error("The uploaded file does not match its type or size. Please choose a valid file.");
    // Never serve the mutable staging object: the upload URL can be reused until expiry.
    await storage.promote(row.stagingKey, row.storageKey, object.etag, row.contentType);
    await tx.orderAttachment.update({ where: { id }, data: { state: "READY", uploadedAt: new Date() } });
    await tx.orderEvent.create({ data: { orderId, actorId, changes: { event: `File uploaded: ${row.filename}` } } });
    await notifyOrderChange(tx, orderId, actorId, [], true);
  }, { timeout: 60_000 });
}
export async function deleteAttachment(db: PrismaClient, storage: AttachmentStorage, actorId: string, orderId: string, id: string) {
  if (!validAttachmentId(id)) throw new Error("Invalid file.");
  await db.$transaction(async tx => {
    await access(tx, orderId, actorId, true);
    const row = await tx.orderAttachment.findFirst({ where: { id, orderId } });
    if (!row) throw new Error("File not found.");
    if (["DELETING", "DELETED"].includes(row.state)) return;
    if (row.state !== "READY") throw new Error("File is not available.");
    await tx.orderAttachment.update({ where: { id }, data: { state: "DELETING", deletedAt: new Date(), deletedById: actorId } });
    await tx.orderEvent.create({ data: { orderId, actorId, changes: { event: `File deleted: ${row.filename}` } } });
    await notifyOrderChange(tx, orderId, actorId, [], true);
  });
  try {
    const row = await db.orderAttachment.findUniqueOrThrow({ where: { id } });
    await storage.remove(row.storageKey);
    await db.orderAttachment.update({ where: { id }, data: { state: "DELETED", objectCleanedAt: new Date() } });
    return true;
  } catch { return false; } // Hidden immediately; durable state permits safe cleanup retries.
}
export async function cleanupAttachments(db: PrismaClient, storage: AttachmentStorage, orderId?: string) {
  const due = await db.orderAttachment.findMany({ where: { ...(orderId ? { orderId } : {}), OR: [{ stagingCleanedAt: null, expiresAt: { lt: new Date() } }, { state: "DELETING" }, { state: "PENDING", expiresAt: { lt: new Date() } }] }, take: 10, orderBy: { expiresAt: "asc" } });
  let cleaned = 0;
  for (const row of due) {
    try {
      await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${row.orderId}::uuid FOR UPDATE`;
        const current = await tx.orderAttachment.findUniqueOrThrow({ where: { id: row.id } });
        if (!current.stagingCleanedAt && current.expiresAt < new Date()) {
          await storage.remove(current.stagingKey);
          await tx.orderAttachment.update({ where: { id: row.id }, data: { stagingCleanedAt: new Date() } });
        }
        if (current.state === "DELETING" || (current.state === "PENDING" && current.expiresAt < new Date())) {
          await storage.remove(current.storageKey);
          await tx.orderAttachment.update({ where: { id: row.id }, data: { state: "DELETED", objectCleanedAt: new Date() } });
        }
      }, { timeout: 40_000 });
      cleaned++;
    } catch { /* Remains tracked; next invocation retries. */ }
  }
  return { checked: due.length, cleaned };
}
