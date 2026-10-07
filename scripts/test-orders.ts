import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { loadOrder, reserveOrder, saveOrder } from "../lib/order-store";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const database = createDatabaseClient(databaseUrl);
  const ids: string[] = [];
  try {
    const first = await database.appUser.create({ data: { clerkUserId: `test-only-${randomUUID()}`, email: `test-${randomUUID()}@example.invalid` } });
    ids.push(first.id);
    const second = await database.appUser.create({ data: { clerkUserId: `test-only-${randomUUID()}`, email: `test-${randomUUID()}@example.invalid` } });
    ids.push(second.id);
    const key = randomUUID();
    const reserved = await Promise.all(Array.from({ length: 4 }, () => reserveOrder(database, first.id, key)));
    assert.equal(new Set(reserved.map(order => order.id)).size, 1);
    const distinct = await Promise.all(Array.from({ length: 5 }, () => reserveOrder(database, first.id, randomUUID())));
    assert.equal(new Set([...distinct, reserved[0]].map(order => order.number)).size, 6);
    let order = reserved[0];
    assert.equal(order.items.length, 3);
    assert.equal(order.fields.status, "In Progress");
    assert.equal(order.fields.division__1 ?? "", "");
    assert.equal((await saveOrder(database, first.id, { id: order.id, base: order.fields, patch: { name: "   " } })).ok, false);
    const saved = await saveOrder(database, first.id, { id: order.id, base: order.fields, patch: { name: "Synthetic persistence test", text_28__1: "PO-A" }, baseItems: order.items, items: [...order.items, { description: "Synthetic item", quantity: "2.5", unitPrice: "12.34" }] });
    assert.equal(saved.ok, true);
    if (!saved.ok) throw new Error("Save failed");
    order = await loadOrder(database, order.id);
    assert.equal(order.items.length, 4);
    assert.equal(order.items[3].unitPrice, "12.34");
    assert.match(order.fields.dateEntered, /^\d{4}-\d{2}-\d{2}$/);
    const original = order;
    const left = await saveOrder(database, first.id, { id: order.id, base: original.fields, patch: { text_28__1: "PO-B" } });
    assert.equal(left.ok, true);
    const independent = await saveOrder(database, second.id, { id: order.id, base: original.fields, patch: { text_13__1: "Synthetic customer" } });
    assert.equal(independent.ok, true);
    const conflict = await saveOrder(database, second.id, { id: order.id, base: original.fields, patch: { text_28__1: "PO-C" } });
    assert.equal(conflict.ok, false);
    const reopened = await loadOrder(database, order.id);
    assert.equal(reopened.fields.text_28__1, "PO-B");
    assert.equal(reopened.fields.text_13__1, "Synthetic customer");
    assert.equal(reopened.creator, first.email);
    const retriedSave = await saveOrder(database, second.id, { id: order.id, base: original.fields, patch: { text_13__1: "Synthetic customer" } });
    assert.equal(retriedSave.ok, true);
    const auditCount = await database.orderEvent.count({ where: { orderId: order.id } });
    assert.equal(auditCount, 4); // Reservation + first save + two independent field edits.
    const changedItems = await saveOrder(database, first.id, { id: order.id, base: reopened.fields, patch: {}, baseItems: reopened.items, items: reopened.items.map((item, index) => index === 0 ? { ...item, description: "Changed" } : item) });
    assert.equal(changedItems.ok, true);
    const itemConflict = await saveOrder(database, second.id, { id: order.id, base: reopened.fields, patch: {}, baseItems: reopened.items, items: reopened.items.map((item, index) => index === 0 ? { ...item, description: "Competing" } : item) });
    assert.equal(itemConflict.ok, false);
    console.log("PASS: concurrent/idempotent numbering, Name validation, defaults, extra items, reopen, independent edits, field/item conflicts, immutable creator and audit deduplication.");
  } finally {
    // Only this invocation's synthetic fixtures, never existing company records.
    const orders = await database.salesOrder.findMany({ where: { creatorId: { in: ids } }, select: { id: true } });
    const orderIds = orders.map(order => order.id);
    await database.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } });
    await database.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await database.salesOrder.deleteMany({ where: { id: { in: orderIds } } });
    await database.appUser.deleteMany({ where: { id: { in: ids } } });
    await database.$disconnect();
  }
}

main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "Order integrity check failed."); process.exitCode = 1; });
