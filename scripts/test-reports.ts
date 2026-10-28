import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { loadReport } from "../lib/report-store";
import { reportFilter } from "../lib/report-model";
async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl), users: string[] = [], orders: string[] = [], token = `report-${randomUUID()}`;
  try {
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `${token}-${role}`, email: `${token}-${role}@example.invalid`, role } })).id);
    const filter = reportFilter({ kind: "customer", from: "1901-01-01", to: "1901-01-31", query: token });
    await assert.rejects(loadReport(db, users[1], filter), /Administrator/);
    for (const [status, dateEntered, deleted] of [["Pending", "1901-01-01", false], ["Complete", "1901-01-31", false], ["Voided", "1901-01-15", false], ["In Progress", "1901-01-15", true], ["In Progress", "1901-02-01", false]] as const) {
      orders.push((await db.salesOrder.create({ data: { creatorId: users[0], requestKey: randomUUID(), name: token, deletedAt: deleted ? new Date() : null, fields: { status, dateEntered, text_13__1: token, text_21__1: `Store ${token}`, text06__1: "2", text0__1: "3" }, items: { create: [{ position: 0, description: token, quantity: "2.5", unitPrice: "12.34" }, { position: 1, description: token.toUpperCase(), quantity: "1", unitPrice: "10" }] } } })).id);
    }
    const report = await loadReport(db, users[0], filter);
    assert.equal(report.rows.length, 2); assert.equal(report.subtotal, "91.70");
    const stores = await loadReport(db, users[0], { ...filter, kind: "store" });
    assert.equal(stores.rows.length, 2); assert.equal(stores.subtotal, "91.70");
    assert.ok(stores.rows.every(row => row.store === `Store ${token}`));
    const products = await loadReport(db, users[0], { ...filter, kind: "products" });
    assert.equal(products.groups.length, 1); assert.equal(products.groups[0].orders, 2);
    assert.equal(products.quantity, "7"); assert.equal(products.matchingTotal, "81.70");
    for (const kind of ["sales", "products", "customer", "store"] as const) {
      const open = await loadReport(db, users[0], { ...filter, kind, status: "open" });
      const completed = await loadReport(db, users[0], { ...filter, kind, status: "completed" });
      assert.deepEqual(open.rows.map(row => row.status), ["Pending"]);
      assert.deepEqual(completed.rows.map(row => row.status), ["Complete"]);
      assert.equal(open.subtotal, "45.85"); assert.equal(completed.subtotal, "45.85");
      if (kind === "products") { assert.equal(open.quantity, "3.5"); assert.equal(completed.matchingTotal, "40.85"); }
    }
    await db.appUser.update({ where: { id: users[0] }, data: { active: false } });
    await assert.rejects(loadReport(db, users[0], filter), /Administrator/);
    console.log("PASS: report database date/status/Trash filters, product grouping, totals and admin/inactive-user permissions.");
  } finally {
    await db.orderItem.deleteMany({ where: { orderId: { in: orders } } });
    await db.salesOrder.deleteMany({ where: { id: { in: orders } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(() => { console.error("FAIL: report verification; no credentials printed."); process.exitCode = 1; });
