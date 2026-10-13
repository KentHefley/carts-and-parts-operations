import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { saveCalendarEntry, saveCalendarSetting } from "../lib/calendar-store";
import { type EventDetails, expandEntries, type Entry } from "../lib/calendar-model";
async function main() {
 const db = createDatabaseClient(developmentCredentials().databaseUrl);
 const users: string[] = [], ids = [randomUUID(), randomUUID(), randomUUID()];
 try {
  for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `calendar-test-${randomUUID()}`, email: `calendar-${randomUUID()}@example.invalid`, role } })).id);
  const setting = { type: "person" as const, id: ids[0], revision: null, name: "Synthetic Person", color: "#123456", active: true };
  await assert.rejects(saveCalendarSetting(db, users[1], setting));
  await saveCalendarSetting(db, users[0], setting);
  const category = { ...setting, type: "category" as const, id: ids[1], name: "Synthetic Category" };
  await saveCalendarSetting(db, users[0], category);
  const details: EventDetails = { title: "Synthetic repeating calendar entry", people: [ids[0]], primaryPerson: ids[0], category: ids[1], location: "Synthetic", allDay: true, start: "2026-10-01", end: "2026-10-01", zone: "America/Chicago", repeat: "DAILY", until: "2026-10-05", notes: "" };
  const input = { id: ids[2], kind: "employee" as const, revision: null, details };
  await assert.rejects(saveCalendarEntry(db, users[1], input));
  await saveCalendarEntry(db, users[0], input); await saveCalendarEntry(db, users[0], input);
  assert.equal(await db.calendarAudit.count({ where: { recordId: ids[2] } }), 1);
  await saveCalendarEntry(db, users[0], { ...input, revision: 0, occurrence: "2026-10-02", details: { ...details, title: "Single exception" } });
  await assert.rejects(saveCalendarEntry(db, users[0], { ...input, revision: 0, details: { ...details, title: "Stale edit" } }));
  await assert.rejects(saveCalendarEntry(db, users[0], { ...input, revision: 1, occurrence: "2026-12-25", remove: true }));
  await saveCalendarEntry(db, users[0], { ...input, revision: 1, occurrence: "2026-10-03", remove: true });
  const stored = await db.calendarEntry.findUniqueOrThrow({ where: { id: ids[2] } });
  const occurrences = expandEntries([{ ...stored, payload: stored.payload as unknown as EventDetails, exceptions: stored.exceptions as unknown as Entry["exceptions"] }], [], [], "2026-10-01", "2026-10-07");
  assert.equal(occurrences.length, 4); assert.equal(occurrences.find(event => event.key === "2026-10-02")?.title, "Single exception");
  await saveCalendarSetting(db, users[0], { ...setting, revision: 0, active: false });
  await assert.rejects(saveCalendarSetting(db, users[0], { ...setting, revision: 0, name: "Stale" }));
  await saveCalendarEntry(db, users[0], { ...input, revision: 2, remove: true });
  assert.ok((await db.calendarEntry.findUniqueOrThrow({ where: { id: ids[2] } })).deletedAt);
  await db.appUser.update({ where: { id: users[0] }, data: { active: false } });
  await assert.rejects(saveCalendarSetting(db, users[0], { ...category, revision: 0, name: "Inactive" }));
  console.log("PASS: calendar permissions, create retry deduplication, revision conflicts, occurrence editing/deletion, series deletion, settings/deactivation and audit.");
 } finally {
  await db.calendarAudit.deleteMany({ where: { recordId: { in: ids } } });
  await db.calendarEntry.deleteMany({ where: { id: ids[2] } });
  await db.calendarCategory.deleteMany({ where: { id: ids[1] } });
  await db.calendarPerson.deleteMany({ where: { id: ids[0] } });
  await db.appUser.deleteMany({ where: { id: { in: users } } }); await db.$disconnect();
 }
}
main().catch(() => { console.error("Calendar verification failed; no credentials logged."); process.exitCode = 1; });
