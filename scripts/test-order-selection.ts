import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { operateOnListedOrder } from "../lib/order-list-operation";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  const users: string[] = [];
  try {
    for (const role of ["USER", "USER", "ADMIN"] as const) {
      const user = await db.appUser.create({ data: { clerkUserId: `selection-test-${randomUUID()}`, email: `selection-${randomUUID()}@example.invalid`, role } });
      users.push(user.id);
    }
    const orders = [];
    for (const [index, status] of ["In Progress", "Complete", "Voided"].entries()) orders.push(await db.salesOrder.create({ data: { creatorId: users[index === 2 ? 1 : 0], requestKey: randomUUID(), name: `Synthetic selection ${status}`, fields: { status, dateEntered: "2026-01-01", text_28__1: "Reset on copy", text_79__1: "Closer", closed_out_date4__1: "2026-01-02" }, items: { create: [0, 1, 2].map(position => ({ position, description: "Synthetic item" })) } } }));
    const key = randomUUID();
    const copied = await operateOnListedOrder(db, users[1], "copy", orders[0].id, key);
    assert.ok(copied.ok && copied.copied);
    const retry = await operateOnListedOrder(db, users[1], "copy", orders[0].id, key);
    assert.deepEqual(retry, copied);
    if (!copied.ok || !copied.copied) throw new Error("Copy fixture failed");
    const stored = await db.salesOrder.findUniqueOrThrow({ where: { id: copied.copied.id } });
    assert.equal(stored.creatorId, users[1]);
    assert.equal((stored.fields as Record<string, string>).status, "In Progress");
    assert.equal((stored.fields as Record<string, string>).text_28__1, "");
    for (const user of [users[0], users[2]]) {
      for (const order of orders.slice(1)) assert.equal((await operateOnListedOrder(db, user, "copy", order.id, randomUUID())).ok, false);
    }
    // Independent transactions allow explicit partial failure without rolling back successes.
    const results = [];
    for (const order of orders) results.push(await operateOnListedOrder(db, users[0], "trash", order.id));
    assert.deepEqual(results.map(result => result.ok), [true, false, false]);
    const deleted = await db.salesOrder.findUniqueOrThrow({ where: { id: orders[0].id } });
    assert.ok(deleted.deletedAt && deleted.purgeAfter);
    assert.equal(deleted.purgeAfter.getTime() - deleted.deletedAt.getTime(), 30 * 86400_000);
    assert.ok((await operateOnListedOrder(db, users[0], "trash", orders[0].id)).ok);
    assert.equal((await db.salesOrder.findUniqueOrThrow({ where: { id: orders[0].id } })).purgeAfter?.getTime(), deleted.purgeAfter.getTime());
    assert.equal((await operateOnListedOrder(db, users[1], "copy", orders[0].id, randomUUID())).ok, false);
    assert.ok((await operateOnListedOrder(db, users[2], "trash", orders[2].id)).ok);
    assert.ok((await operateOnListedOrder(db, users[2], "trash", orders[1].id)).ok);
    assert.equal((await operateOnListedOrder(db, users[0], "copy", "invalid", randomUUID())).ok, false);
    assert.equal((await operateOnListedOrder(db, users[0], "purge" as never, orders[0].id)).ok, false);
    await db.appUser.update({ where: { id: users[1] }, data: { active: false } });
    assert.equal((await operateOnListedOrder(db, users[1], "trash", copied.copied.id)).ok, false);
    assert.equal((await operateOnListedOrder(db, users[1], "copy", copied.copied.id, randomUUID())).ok, false);
    console.log("PASS: list copying/retry, completed source, per-order partial results, creator/admin permissions, 30-day Trash/retry, invalid actions, inactive access and Trash rejection.");
  } finally {
    const rows = await db.salesOrder.findMany({ where: { creatorId: { in: users } }, select: { id: true } });
    const ids = rows.map(row => row.id);
    await db.notification.deleteMany({ where: { orderId: { in: ids } } });
    await db.orderAssignment.deleteMany({ where: { orderId: { in: ids } } });
    await db.orderEvent.deleteMany({ where: { orderId: { in: ids } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await db.salesOrder.deleteMany({ where: { id: { in: ids } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "Selection verification failed."); process.exitCode = 1; });
