import { Prisma } from "../generated/prisma/client";

// Called under the order row lock, in the same transaction as the saved change.
export async function notifyOrderChange(transaction: Prisma.TransactionClient, orderId: string, actorId: string, addedIds: string[], fieldsChanged: boolean) {
  const now = new Date();
  const recipients = await transaction.appUser.findMany({ where: { active: true, id: { not: actorId } }, select: { id: true } });
  for (const recipient of recipients) {
    if (addedIds.includes(recipient.id)) {
      await transaction.notification.create({ data: { recipientId: recipient.id, actorId, orderId, kind: "assignment", updatedAt: now } });
    } else if (fieldsChanged) {
      const recent = await transaction.notification.findFirst({ where: { recipientId: recipient.id, actorId, orderId, kind: "edit", readAt: null, updatedAt: { gte: new Date(now.getTime() - 60_000) } }, orderBy: { updatedAt: "desc" } });
      if (recent) await transaction.notification.update({ where: { id: recent.id }, data: { updatedAt: now } });
      else await transaction.notification.create({ data: { recipientId: recipient.id, actorId, orderId, kind: "edit", updatedAt: now } });
    }
  }
}
