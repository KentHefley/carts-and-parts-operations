import { Prisma, PrismaClient } from "../generated/prisma/client";
import { orderView } from "./order-store";
import { orderEmailTemplate } from "./order-email-template";
import { deliverEmail, developmentSender, emailConfiguration, EmailPayload, verifyEmailRecipients } from "./email-config";
import type { OrderView } from "./order-types";

export class EmailInputError extends Error {}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const include = { items: { orderBy: { position: "asc" as const } }, creator: { select: { email: true, displayName: true } }, assignments: { orderBy: { userId: "asc" as const }, include: { user: true } } };
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
  return JSON.stringify(value);
};

async function authorize(database: Prisma.TransactionClient, actorId: string, orderId: string) {
  const actor = await database.appUser.findUnique({ where: { id: actorId } });
  const order = await database.salesOrder.findUnique({ where: { id: orderId }, include });
  if (!actor?.active || !order || (actor.role !== "ADMIN" && order.creatorId !== actor.id)) throw new EmailInputError("Only the order creator or an approved administrator can send SO email.");
  return order;
}

export async function queueOrderEmail(database: PrismaClient, actorId: string, expected: OrderView, requestKey: string) {
  emailConfiguration();
  if (!expected || !uuid.test(expected.id) || !uuid.test(requestKey)) throw new EmailInputError("Invalid email request.");
  return database.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${expected.id}::uuid FOR UPDATE`;
    const order = await authorize(transaction, actorId, expected.id);
    const existing = await transaction.orderEmail.findUnique({ where: { orderId_actorId_requestKey: { orderId: order.id, actorId, requestKey } } });
    if (existing) return existing.id;
    const pending = await transaction.orderEmail.findFirst({ where: { orderId: order.id, state: { not: "ACCEPTED" } }, orderBy: { createdAt: "desc" } });
    if (pending) throw new EmailInputError("An earlier email attempt still needs attention. Retry that saved attempt before sending another.");
    const view = orderView(order);
    if (!order.name) throw new EmailInputError("Save the order with a Name before sending email.");
    if (canonical(view) !== canonical(expected)) throw new EmailInputError("The order changed before the email snapshot. Reload saved values and review before sending.");
    if (order.assignments.some(assignment => !assignment.user.active)) throw new EmailInputError("Remove inactive assignees before sending email.");
    const to = [...new Set(order.assignments.map(assignment => assignment.user.email.toLowerCase()))];
    verifyEmailRecipients(to);
    const payload = { from: developmentSender, to, ...orderEmailTemplate(view) };
    const message = await transaction.orderEmail.create({ data: { actorId, orderId: order.id, requestKey, payload } });
    await transaction.orderEvent.create({ data: { actorId, orderId: order.id, changes: { event: "SO email queued", recipients: to.join(", ") } } });
    return message.id;
  });
}

export async function sendQueuedEmail(database: PrismaClient, actorId: string, messageId: string, transport = deliverEmail) {
  emailConfiguration();
  if (!uuid.test(messageId)) throw new EmailInputError("Invalid email attempt.");
  const claimed = await database.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT id FROM "OrderEmail" WHERE id = ${messageId}::uuid FOR UPDATE`;
    const message = await transaction.orderEmail.findUnique({ where: { id: messageId } });
    if (!message) throw new EmailInputError("Email attempt was not found.");
    await authorize(transaction, actorId, message.orderId);
    const payload = message.payload as unknown as EmailPayload;
    verifyEmailRecipients(payload.to);
    const recipients = await transaction.appUser.findMany({ where: { email: { in: payload.to }, active: true } });
    if (recipients.length !== payload.to.length) throw new EmailInputError("A recipient is no longer approved. This saved email cannot be retried.");
    if (message.state === "ACCEPTED") return { accepted: true as const, message, payload };
    const now = new Date();
    if (message.firstAttemptAt && now.getTime() - message.firstAttemptAt.getTime() >= 23 * 60 * 60 * 1000) throw new EmailInputError("This attempt is too old for a safe retry. Review it in Resend before sending again; it may already have been accepted.");
    if (message.state === "SENDING" && message.lastAttemptAt && now.getTime() - message.lastAttemptAt.getTime() < 120_000) throw new EmailInputError("This email is already being sent. Wait two minutes before retrying if the result is still unknown.");
    await transaction.orderEmail.update({ where: { id: message.id }, data: { state: "SENDING", firstAttemptAt: message.firstAttemptAt ?? now, lastAttemptAt: now } });
    return { accepted: false as const, message, payload };
  });
  if (claimed.accepted) return;
  let providerId: string;
  try {
    providerId = await transport(claimed.payload, `so-email/${messageId}`);
  } catch {
    await database.$transaction(async transaction => {
      await transaction.orderEmail.update({ where: { id: messageId }, data: { state: "UNCONFIRMED" } });
      await transaction.orderEvent.create({ data: { actorId, orderId: claimed.message.orderId, changes: { event: "SO email acceptance unconfirmed", recipients: claimed.payload.to.join(", ") } } });
    });
    throw new EmailInputError("Email acceptance could not be confirmed. Retry the saved attempt using the same message; check Resend if it continues.");
  }
  // If persistence fails after provider acceptance, retry uses the identical key/payload.
  await database.$transaction(async transaction => {
    await transaction.orderEmail.update({ where: { id: messageId }, data: { state: "ACCEPTED", providerId, acceptedAt: new Date() } });
    await transaction.orderEvent.create({ data: { actorId, orderId: claimed.message.orderId, changes: { event: "SO email accepted by Resend", recipients: claimed.payload.to.join(", ") } } });
  });
}
