import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { savedNameSuggestions } from "../lib/saved-name-store";
import { normalizeSavedName } from "../lib/saved-name-model";

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const users: string[] = [], orders: string[] = [], prefix = `names-${randomUUID()}`;
  try {
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `${prefix}-${role}`, email: `${prefix}-${role}@example.invalid`, role } })).id);
    async function add(invoice: string, store: string, status = "In Progress", trash = false, name: string | null = prefix) {
      orders.push((await db.salesOrder.create({ data: { creatorId: users[0], requestKey: randomUUID(), name, deletedAt: trash ? new Date() : null, fields: { status, text_13__1: invoice, text_21__1: store } } })).id);
    }
    const invoice = `${prefix} Albertson's`, store = `${prefix} Store West`;
    await add(invoice, store); await add(invoice, store, "Complete");
    await add(`${prefix} ALBERTSON’S`, store);
    await add(`${prefix} Albejttsons`, store);
    await add(`${prefix} Hidden Trash`, `${prefix} Hidden Trash`, "Complete", true);
    await add(`${prefix} Hidden Void`, `${prefix} Hidden Void`, "Voided");
    await add(`${prefix} Hidden Draft`, `${prefix} Hidden Draft`, "Pending", false, null);
    await add(`${prefix} 100%_literal`, `${prefix} Store Wildcards`);
    await add(`${prefix} 100XXliteral`, `${prefix} Store Normal`);
    for (const user of users) {
      assert.deepEqual(await savedNameSuggestions(db, user, "text_13__1", `${prefix} Albertsons`), [invoice]);
      assert.deepEqual(await savedNameSuggestions(db, user, "text_21__1", `${prefix} Albertsons`), []);
      assert.deepEqual(await savedNameSuggestions(db, user, "text_21__1", `${prefix} Store West`), [store]);
      assert.deepEqual(await savedNameSuggestions(db, user, "text_13__1", `${prefix} Hidden`), []);
      assert.deepEqual(await savedNameSuggestions(db, user, "text_13__1", `${prefix} 100%_`), [`${prefix} 100%_literal`]);
      assert.deepEqual(await savedNameSuggestions(db, user, "text_13__1", "' ’"), []);
      await assert.rejects(savedNameSuggestions(db, user, "password", prefix), /Invalid/);
      await assert.rejects(savedNameSuggestions(db, user, "text_13__1", "x".repeat(201)), /Invalid/);
    }
    for (let index = 0; index < 15; index++) await add(`${prefix} Choice ${index}`, store);
    const limited = await savedNameSuggestions(db, users[1], "text_13__1", `${prefix} Choice`);
    assert.equal(limited.length, 10); assert.equal(new Set(limited.map(normalizeSavedName)).size, 10);
    await db.appUser.update({ where: { id: users[1] }, data: { active: false } });
    await assert.rejects(savedNameSuggestions(db, users[1], "text_13__1", prefix), /Approved/);
    await db.appUser.update({ where: { id: users[0] }, data: { loginDeletionRequestedAt: new Date() } });
    await assert.rejects(savedNameSuggestions(db, users[0], "text_13__1", prefix), /Approved/);
    await assert.rejects(savedNameSuggestions(db, randomUUID(), "text_13__1", prefix), /Approved/);
    console.log("PASS: saved-name suggestions, field isolation, apostrophe/case deduplication, literal wildcards, Trash/void/draft exclusion, limit and current employee access.");
  } finally {
    await db.salesOrder.deleteMany({ where: { id: { in: orders } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Saved-name checks failed."); process.exitCode = 1; });
