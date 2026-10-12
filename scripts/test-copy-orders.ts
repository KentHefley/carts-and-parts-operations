import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { copyOrder, loadOrder, reserveOrder } from "../lib/order-store";
import { chicagoDate } from "../lib/order-types";
import { protectedStatusFields } from "../lib/order-status";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const database = createDatabaseClient(databaseUrl);
  const users: string[] = [];
  try {
    for (const displayName of ["Synthetic original creator", "Synthetic copying employee"]) {
      const user = await database.appUser.create({ data: { clerkUserId: `copy-test-${randomUUID()}`, email: `copy-${randomUUID()}@example.invalid`, displayName } });
      users.push(user.id);
    }
    const resetKeys = ["division__1", "text_28__1", "start_job_date__1", "text_79__1", "closed_out_date4__1", "voidReason", ...protectedStatusFields];
    for (const status of ["In Progress", "Complete", "Voided"]) {
      const source = await database.salesOrder.create({ data: {
        creatorId: users[0], requestKey: randomUUID(), name: `Synthetic copy ${status}`,
        fields: { ...Object.fromEntries(resetKeys.map(key => [key, "Synthetic old value"])), status, dateEntered: "2000-01-01", text_13__1: "Invoice customer", text_12__1: "NTE text", additional_info__1: "Keep notes", completedNotes: "Keep job notes" },
        items: { create: [0, 1, 2, 3].map(position => ({ position, description: position === 3 ? "CW2 refill kit" : "", quantity: position === 3 ? "2.123456" : null, unitPrice: position === 3 ? "12.34" : null })) },
        assignments: { create: { userId: users[0] } },
        events: { create: { actorId: users[0], changes: { event: "Synthetic prior history" } } },
        emails: { create: { actorId: users[0], requestKey: randomUUID(), payload: {}, state: "ACCEPTED" } },
        attachments: { create: { uploaderId: users[0], requestKey: randomUUID(), filename: "synthetic.pdf", contentType: "application/pdf", size: 10, stagingKey: `copy-test/${randomUUID()}`, storageKey: `copy-test/${randomUUID()}`, expiresAt: new Date(), state: "READY" } },
      } });
      const before = await loadOrder(database, source.id);
      const key = randomUUID();
      const attempts = await Promise.all(Array.from({ length: 3 }, () => copyOrder(database, users[1], before, key)));
      assert.ok(attempts.every(result => result.ok));
      const result = attempts[0]; if (!result.ok) throw new Error(result.message);
      assert.equal(new Set(attempts.map(value => value.ok ? value.order.id : "")).size, 1);
      const copied = result.order;
      assert.notEqual(copied.id, before.id);
      assert.notEqual(copied.number, before.number);
      assert.equal(copied.creator, "Synthetic copying employee");
      assert.equal(copied.fields.name, before.fields.name);
      assert.equal(copied.fields.status, "In Progress");
      assert.equal(copied.fields.dateEntered, chicagoDate());
      for (const field of resetKeys) assert.equal(copied.fields[field], "", field);
      for (const field of ["text_13__1", "text_12__1", "additional_info__1", "completedNotes"]) assert.equal(copied.fields[field], before.fields[field]);
      assert.deepEqual(copied.items, before.items);
      assert.deepEqual(copied.assigneeIds, []);
      assert.deepEqual(await loadOrder(database, source.id), before);
      const record = await database.salesOrder.findUniqueOrThrow({ where: { id: copied.id }, include: { events: true, emails: true, attachments: true, notifications: true } });
      assert.equal(record.creatorId, users[1]);
      assert.equal(record.events.length, 1);
      assert.deepEqual(record.events[0].changes, { event: `Copied from ${before.number}` });
      for (const rows of [record.emails, record.attachments, record.notifications]) assert.equal(rows.length, 0);
      // Recover the original attempt even if the source has since been edited.
      await database.salesOrder.update({ where: { id: source.id }, data: { name: "Synthetic changed source" } });
      const retry = await copyOrder(database, users[1], before, key);
      assert.ok(retry.ok); if (retry.ok) assert.equal(retry.order.id, copied.id);
      const count = await database.salesOrder.count({ where: { creatorId: users[1] } });
      assert.equal((await copyOrder(database, users[1], before, randomUUID())).ok, false);
      assert.equal(await database.salesOrder.count({ where: { creatorId: users[1] } }), count);
      await database.appUser.update({ where: { id: users[1] }, data: { active: false } });
      assert.equal((await copyOrder(database, users[1], await loadOrder(database, source.id), randomUUID())).ok, false);
      await database.appUser.update({ where: { id: users[1] }, data: { active: true } });
      const current = await loadOrder(database, source.id);
      await database.salesOrder.update({ where: { id: source.id }, data: { deletedAt: new Date() } });
      assert.equal((await copyOrder(database, users[1], current, randomUUID())).ok, false);
    }
    assert.equal((await copyOrder(database, users[1], { id: "invalid" } as never, randomUUID())).ok, false);
    const blank = await reserveOrder(database, users[0], randomUUID());
    assert.equal((await copyOrder(database, users[1], blank, randomUUID())).ok, false);
    console.log("PASS: copy resets, preserved fields/items, creator, original integrity, relationship exclusions, concurrent retry deduplication, stale source, inactive access and Trash rejection.");
  } finally {
    const orders = await database.salesOrder.findMany({ where: { creatorId: { in: users } }, select: { id: true } });
    const ids = orders.map(order => order.id);
    await database.notification.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderAttachment.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderEmail.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderAssignment.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderEvent.deleteMany({ where: { orderId: { in: ids } } });
    await database.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await database.salesOrder.deleteMany({ where: { id: { in: ids } } });
    await database.appUser.deleteMany({ where: { id: { in: users } } });
    await database.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "Copy verification failed."); process.exitCode = 1; });
