import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { readOrderBoard } from "../lib/order-board-store";
import { parseBoardQuery, appendBoardRows, type BoardFilters } from "../lib/order-board-model";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  const prefix = `Synthetic board ${randomUUID()}`;
  const users: string[] = [];
  const filters: BoardFilters = { completed: false, name: prefix, number: "", status: "" };
  try {
    for (const role of ["USER", "USER", "ADMIN"] as const) users.push((await db.appUser.create({ data: { clerkUserId: randomUUID(), email: `${randomUUID()}@example.invalid`, displayName: role === "ADMIN" ? "Board Admin" : "Board Tester", role } })).id);
    await db.salesOrder.createMany({ data: Array.from({ length: 166 }, (_, index) => ({
      creatorId: users[0], requestKey: randomUUID(), name: `${prefix} ${index === 0 ? "Oldest %_\\'" : index}`,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(index / 3))),
      fields: { status: index < 110 ? ["Pending", "In Progress", "Expedite"][index % 3] : index < 165 ? (index % 2 ? "Complete" : "Voided") : "In Progress", dateEntered: index === 0 ? "2025-12-31" : "2026-01-01", statusChangedAt: "2026-01-02T12:00:00.000Z", division__1: "Corporate", dropdown__1: "Parts", start_job_date__1: "2026-02-02" },
      deletedAt: index === 165 ? new Date() : null,
    })) });
    // An unnamed draft must never enter either board.
    await db.salesOrder.create({ data: { creatorId: users[0], requestKey: randomUUID(), fields: { status: "In Progress" } } });
    const first = await readOrderBoard(db, users[0], filters);
    assert.equal(first.total, 110); assert.equal(first.rows.length, 50); assert.ok(first.nextCursor);
    assert.ok(first.rows.every(row => row.canDelete && row.division === "Corporate" && row.jobType === "Parts" && row.scheduled === "2026-02-02"));
    const second = await readOrderBoard(db, users[0], filters, first.nextCursor);
    const third = await readOrderBoard(db, users[0], filters, second.nextCursor);
    assert.equal(second.rows.length, 50); assert.equal(third.rows.length, 10); assert.equal(third.nextCursor, null);
    const all = [...first.rows, ...second.rows, ...third.rows];
    assert.equal(new Set(all.map(row => row.id)).size, 110);
    assert.equal(all.at(-1)?.name, `${prefix} Oldest %_\\'`);
    const search = await readOrderBoard(db, users[0], { ...filters, name: `${prefix.toUpperCase()} OLDEST` });
    assert.deepEqual(search.rows.map(row => row.id), [all.at(-1)!.id]);
    assert.equal((await readOrderBoard(db, users[0], { ...filters, name: `${prefix} Oldest %_\\'` })).total, 1);
    assert.equal((await readOrderBoard(db, users[0], { ...filters, number: all.at(-1)!.number.toLowerCase() })).total, 1);
    assert.equal((await readOrderBoard(db, users[0], { ...filters, number: "%" })).total, 0);
    assert.equal((await readOrderBoard(db, users[0], { ...filters, status: "Pending" })).total, 37);
    assert.ok((await readOrderBoard(db, users[1], filters)).rows.every(row => !row.canDelete));
    const closed = { ...filters, completed: true };
    const closedFirst = await readOrderBoard(db, users[0], closed);
    assert.equal(closedFirst.total, 55); assert.ok(closedFirst.rows.every(row => !row.canDelete));
    assert.equal((await readOrderBoard(db, users[0], closed, closedFirst.nextCursor)).rows.length, 5);
    assert.ok((await readOrderBoard(db, users[2], closed)).rows.every(row => row.canDelete));
    await db.appUser.update({ where: { id: users[1] }, data: { active: false } });
    await db.orderAssignment.createMany({ data: [{ orderId: first.rows[0].id, userId: users[1] }, { orderId: first.rows[0].id, userId: users[2] }] });
    assert.equal((await readOrderBoard(db, users[0], filters)).rows[0].assigned, "Board Admin, Board Tester (inactive)");
    await assert.rejects(readOrderBoard(db, users[1], filters), /Approved access/);
    // New rows above a cursor must not shift the old next-page boundary.
    await db.salesOrder.create({ data: { creatorId: users[0], requestKey: randomUUID(), name: `${prefix} Newly arrived`, fields: { status: "In Progress", dateEntered: "2026-01-02" } } });
    assert.deepEqual((await readOrderBoard(db, users[0], filters, first.nextCursor)).rows.map(row => row.id), second.rows.map(row => row.id));
    assert.equal((await readOrderBoard(db, users[0], filters)).rows[0].name, `${prefix} Newly arrived`);
    await db.salesOrder.update({ where: { id: first.rows[1].id }, data: { fields: { status: "Complete", statusChangedAt: "2026-01-03" } } });
    await db.salesOrder.update({ where: { id: first.rows[2].id }, data: { deletedAt: new Date() } });
    const refresh = await readOrderBoard(db, users[0], filters);
    assert.equal(refresh.total, 109); assert.ok(!refresh.rows.some(row => [first.rows[1].id, first.rows[2].id].includes(row.id)));
    assert.deepEqual((await readOrderBoard(db, users[0], filters, first.nextCursor)).rows.map(row => row.id), second.rows.map(row => row.id));
    assert.equal((await readOrderBoard(db, users[2], closed)).total, 56);
    assert.equal(appendBoardRows(first.rows, [first.rows[0]]).length, 50);
    for (const invalid of ["Complete", "Anything"]) assert.throws(() => parseBoardQuery({ ...filters, status: invalid }));
    for (const invalid of [false, 0, {}, { date: "", id: randomUUID(), createdAt: "invalid" }]) assert.throws(() => parseBoardQuery(filters, invalid as never));
    console.log("PASS: bounded pages/tied dates, full-database search, literal characters, membership, permissions, cursor insertions and refresh changes (development only).");
  } finally {
    // Only this run's synthetic users/orders; no existing company records.
    const ids = (await db.salesOrder.findMany({ where: { creatorId: { in: users } }, select: { id: true } })).map(row => row.id);
    await db.orderAssignment.deleteMany({ where: { orderId: { in: ids } } });
    await db.salesOrder.deleteMany({ where: { id: { in: ids } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Board tests failed."); process.exitCode = 1; });
