import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { reserveOrder, saveOrder, loadOrder } from "../lib/order-store";
import { queueOrderEmail, sendQueuedEmail } from "../lib/order-email-store";
import { developmentRecipient } from "../lib/email-config";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const database = createDatabaseClient(databaseUrl);
  const ids: string[] = [];
  const otherId = randomUUID();
  try {
    const kent = await database.appUser.findUniqueOrThrow({ where: { email: developmentRecipient } });
    assert.equal(kent.active, true);
    await database.appUser.create({ data: { id: otherId, clerkUserId: `email-test-${otherId}`, email: `${otherId}@example.invalid`, role: "USER" } });
    let order = await reserveOrder(database, kent.id, randomUUID()); ids.push(order.id);
    const saved = await saveOrder(database, kent.id, { id: order.id, base: order.fields, patch: { name: "Synthetic SO email verification", text_28__1: "EMAIL-TEST", text_13__1: "Sample customer" }, baseAssigneeIds: [], assigneeIds: [kent.id] });
    assert.equal(saved.ok, true); if (!saved.ok) throw new Error("Fixture save failed"); order = saved.order;
    await assert.rejects(queueOrderEmail(database, otherId, order, randomUUID()), /creator|administrator/);
    await database.appUser.update({ where: { id: otherId }, data: { role: "ADMIN", active: false } });
    await assert.rejects(queueOrderEmail(database, otherId, order, randomUUID()), /creator|administrator/);
    await database.appUser.update({ where: { id: otherId }, data: { role: "USER", active: true } });
    await assert.rejects(queueOrderEmail(database, kent.id, { ...order, fields: { ...order.fields, text_28__1: "stale" } }, randomUUID()), /changed/);
    const requestKey = randomUUID();
    const [first, repeated] = await Promise.all([queueOrderEmail(database, kent.id, order, requestKey), queueOrderEmail(database, kent.id, order, requestKey)]);
    assert.equal(first, repeated);
    let calls = 0;
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    const sending = sendQueuedEmail(database, kent.id, first, async () => { calls++; started(); await gate; throw new Error("Simulated timeout"); });
    await ready;
    await assert.rejects(sendQueuedEmail(database, kent.id, first, async () => { calls++; return "must-not-send"; }), /already being sent/);
    release();
    await assert.rejects(sending, /could not be confirmed/);
    const edited = await saveOrder(database, kent.id, { id: order.id, base: order.fields, patch: { text_28__1: "CHANGED-AFTER-SNAPSHOT" } }); assert.equal(edited.ok, true);
    await sendQueuedEmail(database, kent.id, first, async (payload, key) => { calls++; assert.match(payload.text, /EMAIL-TEST/); assert.doesNotMatch(payload.text, /CHANGED-AFTER-SNAPSHOT/); assert.equal(key, `so-email/${first}`); return "mock-provider-id"; });
    await sendQueuedEmail(database, kent.id, first, async () => { calls++; throw new Error("Must not resend accepted email"); });
    assert.equal(calls, 2);
    order = await loadOrder(database, order.id);
    const next = await queueOrderEmail(database, kent.id, order, randomUUID());
    await database.orderEmail.update({ where: { id: next }, data: { firstAttemptAt: new Date(Date.now() - 24 * 60 * 60 * 1000), state: "UNCONFIRMED" } });
    await assert.rejects(sendQueuedEmail(database, kent.id, next, async () => "never"), /too old/);
    await database.orderEmail.delete({ where: { id: next } });
    await database.orderAssignment.create({ data: { orderId: order.id, userId: otherId } });
    order = await loadOrder(database, order.id);
    await assert.rejects(queueOrderEmail(database, kent.id, order, randomUUID()), /only be sent to/);
    await database.orderAssignment.delete({ where: { orderId_userId: { orderId: order.id, userId: otherId } } });
    console.log("Email checks passed: permission, stale snapshot, concurrent requests, failed retry, snapshot retention, accepted deduplication, expired retry, allowlist.");
    if (process.argv.includes("--send-synthetic")) {
      let real = await reserveOrder(database, kent.id, randomUUID());
      const result = await saveOrder(database, kent.id, { id: real.id, base: real.fields, patch: { name: "Synthetic Resend verification — no company order data", text_13__1: "Sample customer", additional_info__1: "Development email integration test. No action required." }, baseAssigneeIds: [], assigneeIds: [kent.id] });
      assert.equal(result.ok, true); if (!result.ok) throw new Error("Real fixture save failed"); real = result.order;
      const email = await queueOrderEmail(database, kent.id, real, randomUUID());
      await sendQueuedEmail(database, kent.id, email);
      console.log(`Resend accepted ${real.number} to Kent. Synthetic order and email audit retained for review.`);
    }
  } finally {
    await database.orderEmail.deleteMany({ where: { orderId: { in: ids } } });
    await database.notification.deleteMany({ where: { OR: [{ orderId: { in: ids } }, { recipientId: otherId }, { actorId: otherId }] } });
    await database.orderAssignment.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderEvent.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await database.salesOrder.deleteMany({ where: { id: { in: ids } } });
    await database.appUser.deleteMany({ where: { id: otherId } });
    await database.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Email test failed; credentials not logged."); process.exitCode = 1; });
