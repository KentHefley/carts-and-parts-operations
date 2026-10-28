import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { personalDescriptionSuggestions } from "../lib/personal-description-store";
import { savedNameSuggestions } from "../lib/saved-name-store";
import { reserveOrder, saveOrder } from "../lib/order-store";
import type { OrderView } from "../lib/order-types";

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const users: string[] = [], orders: string[] = [], token = `personal-${randomUUID()}`;
  try {
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `${token}-${role}`, email: `${token}-${role}@example.invalid`, role } })).id);
    async function persist(actor: string, order: OrderView, patch: Record<string, string>, items = order.items) {
      const result = await saveOrder(db, actor, { id: order.id, base: order.fields, patch, baseItems: order.items, items });
      assert.equal(result.ok, true); if (!result.ok) throw new Error("Expected successful description save."); return result.order;
    }
    let first = await reserveOrder(db, users[0], randomUUID()); orders.push(first.id);
    let second = await reserveOrder(db, users[1], randomUUID()); orders.push(second.id);
    const ownItem = `${token} A refill kit`, ownService = `${token} A cart service`;
    const otherItem = `${token} B wheel replacement`, otherService = `${token} B on-site service`;
    first = await persist(users[0], first, { name: token, text_32__1: ownService, text_13__1: `${token} Shared Invoice`, text_21__1: `${token} Shared Store` }, first.items.map((item, index) => index ? item : { ...item, description: ownItem }));
    second = await persist(users[1], second, { name: token, text_32__1: otherService }, second.items.map((item, index) => index ? item : { ...item, description: otherItem }));
    for (const [index, item, service] of [[0, ownItem, ownService], [1, otherItem, otherService]] as const) {
      assert.deepEqual(await personalDescriptionSuggestions(db, users[index], "itemDescription", token), [item]);
      assert.deepEqual(await personalDescriptionSuggestions(db, users[index], "text_32__1", token), [service]);
      assert.deepEqual(await personalDescriptionSuggestions(db, users[index], "itemDescription", service), []);
      assert.deepEqual(await savedNameSuggestions(db, users[index], "text_13__1", token), [`${token} Shared Invoice`]);
      assert.deepEqual(await savedNameSuggestions(db, users[index], "text_21__1", token), [`${token} Shared Store`]);
    }
    // Quantity/price-only work must not adopt someone else's unchanged text.
    first = await persist(users[1], first, {}, first.items.map((item, index) => index ? item : { ...item, quantity: "2", unitPrice: "12.34" }));
    assert.deepEqual(await personalDescriptionSuggestions(db, users[1], "itemDescription", ownItem), []);
    const crossCreator = `${token} B saved on A's order`;
    first = await persist(users[1], first, {}, first.items.map((item, index) => index === 1 ? { ...item, description: crossCreator } : item));
    assert.deepEqual(await personalDescriptionSuggestions(db, users[1], "itemDescription", crossCreator), [crossCreator]);
    assert.deepEqual(await personalDescriptionSuggestions(db, users[0], "itemDescription", crossCreator), []);
    first = await persist(users[0], first, { text_32__1: `${token} A revised service` });
    assert.deepEqual(await personalDescriptionSuggestions(db, users[0], "text_32__1", ownService), []);
    const options = Array.from({ length: 12 }, (_, index) => ({ description: `${token} Choice ${index}`, quantity: "", unitPrice: "" }));
    first = await persist(users[0], first, {}, [...first.items, ...options]);
    assert.equal((await personalDescriptionSuggestions(db, users[0], "itemDescription", `${token} Choice`)).length, 10);
    await assert.rejects(personalDescriptionSuggestions(db, users[0], "text_13__1", token), /Invalid/);
    await assert.rejects(personalDescriptionSuggestions(db, users[0], "itemDescription", "x".repeat(201)), /Invalid/);
    assert.deepEqual(await personalDescriptionSuggestions(db, users[0], "itemDescription", "a"), []);
    await db.salesOrder.update({ where: { id: first.id }, data: { deletedAt: new Date() } });
    assert.deepEqual(await personalDescriptionSuggestions(db, users[0], "itemDescription", token), []);
    assert.deepEqual(await personalDescriptionSuggestions(db, users[0], "text_32__1", token), []);
    await db.salesOrder.update({ where: { id: second.id }, data: { fields: { ...second.fields, status: "Voided" } } });
    assert.deepEqual(await personalDescriptionSuggestions(db, users[1], "itemDescription", token), []);
    await db.appUser.update({ where: { id: users[1] }, data: { active: false } });
    await assert.rejects(personalDescriptionSuggestions(db, users[1], "itemDescription", token), /Approved/);
    await db.appUser.update({ where: { id: users[0] }, data: { loginDeletionRequestedAt: new Date() } });
    await assert.rejects(personalDescriptionSuggestions(db, users[0], "text_32__1", token), /Approved/);
    console.log("PASS: real-save personal item/service history, actor isolation across shared orders, no learning from quantity-only edits, shared names retained, removed-text/Trash/Voided exclusion, limits and current access.");
  } finally {
    await db.notification.deleteMany({ where: { orderId: { in: orders } } });
    await db.orderEvent.deleteMany({ where: { orderId: { in: orders } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: orders } } });
    await db.salesOrder.deleteMany({ where: { id: { in: orders } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Personal suggestion checks failed."); process.exitCode = 1; });
