import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { changeCalendarBlackout, readCalendarBlackouts } from "../lib/calendar-blackout-store";
import { blackoutKind } from "../lib/calendar-blackout-model";
import { saveCalendarEntry, saveCalendarSetting, calendarPersonDeletionPreview } from "../lib/calendar-store";

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const ids = [randomUUID(), randomUUID()], users: string[] = [], category = randomUUID(), person = randomUUID();
  try {
    const kent = await db.appUser.findFirst({ where: { email: "kent@cartsandparts.com", active: true, role: "ADMIN" } });
    assert.ok(kent, "Approved development Super Admin required.");
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `blackout-${randomUUID()}`, email: `blackout-${randomUUID()}@example.invalid`, role } })).id);
    const details = { start: "1901-11-23", end: "1901-11-29", reason: "Synthetic Thanksgiving blackout" };
    const create = { id: ids[0], revision: null, details };
    for (const user of users) await assert.rejects(changeCalendarBlackout(db, user, create), /Super Admin/);
    await changeCalendarBlackout(db, kent.id, create);
    const auditCount = await db.calendarAudit.count({ where: { recordId: ids[0] } });
    await changeCalendarBlackout(db, kent.id, create);
    assert.equal(await db.calendarAudit.count({ where: { recordId: ids[0] } }), auditCount);
    let row = (await readCalendarBlackouts(db)).find(row => row.id === ids[0])!;
    assert.equal(row.reason, details.reason); assert.equal(row.end, details.end);
    const changed = { ...details, reason: "Synthetic updated reason" };
    await changeCalendarBlackout(db, kent.id, { id: row.id, revision: row.revision, details: changed });
    await assert.rejects(changeCalendarBlackout(db, kent.id, { id: row.id, revision: row.revision, details: { ...details, reason: "Stale edit" } }), /changed/);
    const newest = (await readCalendarBlackouts(db)).find(value => value.id === row.id)!;
    for (const user of users) await assert.rejects(changeCalendarBlackout(db, user, { id: row.id, revision: newest.revision, remove: true }), /Super Admin/);
    await saveCalendarSetting(db, kent.id, { type: "category", id: category, revision: null, name: "Synthetic Time Off", color: "#238f8b", active: true });
    await saveCalendarSetting(db, kent.id, { type: "person", id: person, revision: null, name: `Synthetic blackout person ${person}`, color: "#238f8b", active: true });
    const event = { title: "Synthetic time off is allowed", start: details.start, end: details.end, allDay: true, zone: "America/Chicago", repeat: "NONE" as const, until: "", people: [person], primaryPerson: person, location: "", notes: "", category };
    // Other administrators retain ordinary event editing despite an overlapping notice.
    await saveCalendarEntry(db, users[0], { id: ids[1], kind: "employee", revision: null, details: event });
    await saveCalendarEntry(db, users[0], { id: ids[1], kind: "employee", revision: 0, details: { ...event, notes: "Still editable" } });
    await assert.rejects(saveCalendarEntry(db, users[0], { id: row.id, kind: "employee", revision: newest.revision, details: event }), /changed/);
    const preview = await calendarPersonDeletionPreview(db, kent.id, person);
    assert.deepEqual(preview.events.map(event => event.id), [ids[1]]);
    assert.equal((await db.calendarEntry.findUniqueOrThrow({ where: { id: row.id } })).kind, blackoutKind);
    row = newest;
    await changeCalendarBlackout(db, kent.id, { id: row.id, revision: row.revision, remove: true });
    const deletedAuditCount = await db.calendarAudit.count({ where: { recordId: row.id } });
    await changeCalendarBlackout(db, kent.id, { id: row.id, revision: row.revision, remove: true });
    assert.equal(await db.calendarAudit.count({ where: { recordId: row.id } }), deletedAuditCount);
    assert.equal((await readCalendarBlackouts(db)).some(value => value.id === row.id), false);
    await assert.rejects(changeCalendarBlackout(db, kent.id, create), /processed/);
    assert.equal(await db.calendarEntry.count({ where: { id: ids[1], deletedAt: null } }), 1);
    assert.ok(deletedAuditCount >= 3);
    console.log("PASS: blackout Super Admin permissions, saved ranges, conflicts, audit/idempotency, soft deletion, normal-event isolation and overlapping time off allowed.");
  } finally {
    await db.calendarAudit.deleteMany({ where: { recordId: { in: [...ids, category, person] } } });
    await db.calendarEntry.deleteMany({ where: { id: { in: ids } } });
    await db.calendarCategory.deleteMany({ where: { id: category } });
    await db.calendarPerson.deleteMany({ where: { id: person } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "Blackout integration check failed; credentials withheld."); process.exitCode = 1; });
