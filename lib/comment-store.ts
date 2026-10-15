import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "../generated/prisma/client";
import type { CommentInput, CommentView } from "./comment-types";
export class CommentError extends Error {}
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const mentioned = (value: unknown): string[] => Array.isArray(value) ? value.filter(uuid) : [];
async function access(db: Prisma.TransactionClient, actorId: string, orderId: string) {
  const [actor, order] = await Promise.all([
    db.appUser.findUnique({ where: { id: actorId } }),
    db.salesOrder.findUnique({ where: { id: orderId }, select: { deletedAt: true, name: true } }),
  ]);
  if (!actor?.active || actor.loginDeletionRequestedAt || actor.loginDeletedAt) throw new CommentError("Active approved access is required.");
  if (!order || order.deletedAt || !order.name) throw new CommentError("Comments are available only for saved orders outside Trash.");
  return actor;
}
export async function readComments(db: PrismaClient, actorId: string, orderId: string, before?: string) {
  if (!uuid(orderId) || (before !== undefined && !uuid(before))) throw new CommentError("Invalid comments page.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${orderId}::uuid FOR SHARE`;
    const actor = await access(tx, actorId, orderId);
    const cursor = before ? await tx.orderComment.findFirst({ where: { id: before, orderId }, select: { id: true, createdAt: true } }) : null;
    if (before && !cursor) throw new CommentError("Comments page not found. Return to the newest comments.");
    // Compare saved boundaries directly: OFFSET would skip an extra row if the cursor was deleted.
    const entries = await tx.orderComment.findMany({ where: { orderId, deletedAt: null, ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51 });
    const rows: CommentView[] = entries.slice(0, 50).map(row => ({ id: row.id, authorId: row.authorId, author: row.authorName, text: row.text, mentionIds: mentioned(row.mentions), version: row.version, createdAt: row.createdAt.toISOString(), editedAt: row.editedAt?.toISOString() ?? null, canManage: actor.role === "ADMIN" || actor.id === row.authorId }));
    const historicalIds = [...new Set(rows.flatMap(row => row.mentionIds))];
    const users = await tx.appUser.findMany({ where: { OR: [{ active: true, loginDeletionRequestedAt: null, loginDeletedAt: null }, { id: { in: historicalIds } }] }, select: { id: true, displayName: true, email: true, active: true, loginDeletionRequestedAt: true, loginDeletedAt: true }, orderBy: [{ displayName: "asc" }, { email: "asc" }] });
    return { rows, users: users.map(user => ({ id: user.id, name: user.displayName || user.email, active: user.active && !user.loginDeletedAt && !user.loginDeletionRequestedAt })), nextCursor: entries.length > 50 ? rows.at(-1)!.id : undefined };
  }, { maxWait: 10_000, timeout: 30_000 });
}
export async function mutateComment(db: PrismaClient, actorId: string, input: CommentInput) {
  if (!input || !uuid(input.orderId) || !["add", "edit", "delete"].includes(input.operation)) throw new CommentError("Invalid comment request.");
  if (input.operation === "add") { if (!uuid(input.requestKey)) throw new CommentError("Invalid comment request."); }
  else if (!uuid(input.id) || !Number.isSafeInteger(input.version) || input.version < 1) throw new CommentError("Invalid comment revision.");
  if (input.operation !== "delete" && (typeof input.text !== "string" || !input.text.trim() || input.text.length > 10_000 || /\u0000/.test(input.text) || !Array.isArray(input.mentionIds) || input.mentionIds.length > 100 || input.mentionIds.some(id => !uuid(id)) || new Set(input.mentionIds.map(id => id.toLowerCase())).size !== input.mentionIds.length)) throw new CommentError("Enter a comment of 1–10,000 characters and mention only distinct active employees.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${input.orderId}::uuid FOR UPDATE`;
    const actor = await access(tx, actorId, input.orderId);
    const existing = input.operation === "add"
      ? await tx.orderComment.findUnique({ where: { orderId_authorId_requestKey: { orderId: input.orderId, authorId: actorId, requestKey: input.requestKey } } })
      : await tx.orderComment.findFirst({ where: { id: input.id, orderId: input.orderId } });
    const text = input.operation === "delete" ? "" : input.text.trim();
    const ids = input.operation === "delete" ? [] : input.mentionIds.map(id => id.toLowerCase()).sort();
    const hash = createHash("sha256").update(JSON.stringify([text, ids])).digest("hex");
    if (input.operation === "add" && existing) {
      if (existing.requestHash !== hash) throw new CommentError("This posting attempt already saved different content. Refresh Comments to review it before posting again.");
      return existing.id; // Deleted/edited comments are never recreated by a retry.
    }
    if (input.operation !== "add") {
      if (!existing || (existing.authorId !== actorId && actor.role !== "ADMIN")) throw new CommentError("Only the author or an administrator can edit or delete this comment.");
      if (existing.deletedAt) {
        if (input.operation === "delete") return existing.id;
        throw new CommentError("This comment was deleted. Your input is preserved; refresh comments to review.");
      }
      if (input.operation === "edit" && existing.text === text && JSON.stringify(mentioned(existing.mentions).sort()) === JSON.stringify(ids)) return existing.id;
      if (existing.version !== input.version) throw new CommentError("Someone else changed this comment. Your input is preserved. Refresh Comments to review before editing or deleting again.");
    }
    if (input.operation !== "delete") {
      const active = await tx.appUser.count({ where: { id: { in: ids }, active: true, loginDeletedAt: null, loginDeletionRequestedAt: null } });
      if (active !== ids.length) throw new CommentError("A mentioned employee is no longer active. Remove them before posting or saving.");
    }
    const beforeText = existing?.text ?? "";
    const beforeIds = mentioned(existing?.mentions);
    const now = new Date();
    const authorName = existing?.authorName ?? (actor.displayName || actor.email);
    const comment = input.operation === "add"
      ? await tx.orderComment.create({ data: { orderId: input.orderId, authorId: actorId, authorName, requestKey: input.requestKey, requestHash: hash, text, mentions: ids } })
      : await tx.orderComment.update({ where: { id: existing!.id }, data: { text, mentions: ids, version: { increment: 1 }, ...(input.operation === "delete" ? { deletedAt: now } : { editedAt: now }) } });
    await tx.orderEvent.create({ data: { actorId, orderId: input.orderId, changes: { event: `Comment ${input.operation === "add" ? "added" : input.operation === "edit" ? "edited" : "deleted"}`, commentId: comment.id, commentAuthor: authorName, comment: { before: beforeText, after: text }, mentions: { before: beforeIds, after: ids } } } });
    if (input.operation === "add") {
      const recipients = await tx.appUser.findMany({ where: { active: true, loginDeletedAt: null, loginDeletionRequestedAt: null, id: { not: actorId }, OR: [{ assignments: { some: { orderId: input.orderId } } }, { id: { in: ids } }] }, select: { id: true } });
      if (recipients.length) await tx.notification.createMany({ data: recipients.map(user => ({ actorId, orderId: input.orderId, recipientId: user.id, kind: ids.includes(user.id) ? "mention" : "comment" })) });
    }
    return comment.id;
  }, { maxWait: 10_000, timeout: 30_000 });
}
