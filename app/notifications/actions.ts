"use server";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";

export async function readNotifications() {
  const user = await requireApprovedUser();
  const database = getDatabase();
  const [unread, rows] = await Promise.all([
    database.notification.count({ where: { recipientId: user.id, readAt: null } }),
    database.notification.findMany({ where: { recipientId: user.id }, orderBy: { updatedAt: "desc" }, take: 50, include: { actor: { select: { email: true, displayName: true } }, order: { select: { number: true, name: true } } } }),
  ]);
  return { unread, rows: rows.map(row => ({ id: row.id, orderId: row.orderId, number: `DEV-${String(row.order.number).padStart(6, "0")}`, name: row.order.name ?? "Sales Order", actor: row.actor.displayName || row.actor.email, kind: row.kind, read: row.readAt !== null, updatedAt: row.updatedAt.toISOString() })) };
}

export async function markNotificationsRead() {
  const user = await requireApprovedUser();
  await getDatabase().notification.updateMany({ where: { recipientId: user.id, readAt: null }, data: { readAt: new Date() } });
  return readNotifications();
}
