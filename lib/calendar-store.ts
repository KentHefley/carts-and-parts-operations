import { Prisma, PrismaClient } from "../generated/prisma/client";
import { isDeepStrictEqual } from "node:util";
import { randomUUID } from "node:crypto";
import { type CalendarKind, type Entry, type EventDetails, validateDetails, uuid, colorValid } from "./calendar-model";
async function admin(tx: Prisma.TransactionClient, actorId: string) {
  const actor = await tx.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.role !== "ADMIN") throw new Error("Administrator access required.");
}
export async function calendarData(db: PrismaClient, kind: CalendarKind) {
  const [people, categories, rows] = await Promise.all([db.calendarPerson.findMany({ orderBy: { name: "asc" } }), db.calendarCategory.findMany({ orderBy: { name: "asc" } }), db.calendarEntry.findMany({ where: { kind, deletedAt: null }, take: 1001 })]);
  if (rows.length > 1000) throw new Error("Calendar capacity reached. Contact an administrator.");
  return { people, categories, entries: rows.map(row => ({ id: row.id, kind: row.kind, revision: row.revision, payload: row.payload as unknown as EventDetails, exceptions: row.exceptions as unknown as Entry["exceptions"] })) };
}
const personName = (name: string) => name.trim().replace(/\s+/g, " ");
const personKey = (name: string) => personName(name).toLowerCase();
function nextPersonColor(used: string[]) {
  for (let index = 0; index < 360; index++) {
    const hue = (index * 137.508) % 360 / 60, chroma = .48, x = chroma * (1 - Math.abs(hue % 2 - 1));
    const channels = hue < 1 ? [chroma, x, 0] : hue < 2 ? [x, chroma, 0] : hue < 3 ? [0, chroma, x] : hue < 4 ? [0, x, chroma] : hue < 5 ? [x, 0, chroma] : [chroma, 0, x];
    const color = "#" + channels.map(channel => Math.round((channel + .12) * 255).toString(16).padStart(2, "0")).join("");
    if (!used.some(existing => existing.toLowerCase() === color)) return color;
  }
  return "#1764A0";
}
export async function selectOrAddCalendarPerson(db: PrismaClient, actorId: string, input: { id: string; name: string }) {
  if (!input || !uuid(input.id) || typeof input.name !== "string" || !personName(input.name) || input.name.length > 200) throw new Error("Enter a person’s name (up to 200 characters).");
  return db.$transaction(async tx => {
    await admin(tx, actorId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('calendar-person-directory'))`;
    const people = await tx.calendarPerson.findMany();
    const retry = people.find(person => person.id === input.id);
    if (retry && personKey(retry.name) !== personKey(input.name)) throw new Error("This person changed. Refresh and select the saved name.");
    const existing = retry ?? people.find(person => personKey(person.name) === personKey(input.name));
    if (existing) { if (!existing.active) throw new Error("This person is inactive. An admin can reactivate them in Calendar Settings."); return existing; }
    const row = await tx.calendarPerson.create({ data: { id: input.id, name: personName(input.name), color: nextPersonColor(people.map(person => person.color)) } });
    await tx.calendarAudit.create({ data: { actorId, recordId: row.id, recordType: "person", changes: { before: null, after: { name: row.name, color: row.color, active: true } } } });
    return row;
  }, { maxWait: 10_000, timeout: 30_000 });
}
export async function saveCalendarEntry(db: PrismaClient, actorId: string, input: { id: string; kind: CalendarKind; revision: number | null; details: unknown; occurrence?: string; remove?: boolean }) {
  if (!input || !uuid(input.id) || !["management", "employee"].includes(input.kind) || (input.revision !== null && (!Number.isSafeInteger(input.revision) || input.revision < 0)) || (input.occurrence && !/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d)?$/.test(input.occurrence))) throw new Error("Invalid calendar request.");
  const details = input.remove ? null : validateDetails(input.details);
  await db.$transaction(async tx => {
    await admin(tx, actorId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('calendar-person-directory'))`;
    const old = await tx.calendarEntry.findUnique({ where: { id: input.id } });
    if (input.revision === null && old) {
      if (!old.deletedAt && old.creatorId === actorId && old.kind === input.kind && isDeepStrictEqual(old.payload, details)) return;
      throw new Error("This creation was already processed. Refresh to review it.");
    }
    if (input.revision !== null && (!old || old.deletedAt || old.kind !== input.kind || old.revision !== input.revision)) throw new Error("Someone changed this event. Your input is preserved. Close and reopen it to review the saved version.");
    if (!old && (input.remove || input.occurrence)) throw new Error("Event not found.");
    if (details) {
      const previous = (old?.payload ?? {}) as unknown as EventDetails;
      const people = await tx.calendarPerson.findMany({ where: { id: { in: details.people } } });
      if (people.length !== details.people.length || people.some(person => !person.active && !previous.people?.includes(person.id))) throw new Error("Choose active employees.");
      if (input.kind === "employee") {
        const category = uuid(details.category) ? await tx.calendarCategory.findUnique({ where: { id: details.category } }) : null;
        if (!category || (!category.active && previous.category !== details.category)) throw new Error("Choose an active category.");
      } else if (details.category) throw new Error("Management events do not use categories.");
    }
    let after: Prisma.InputJsonValue;
    if (!old) {
      await tx.calendarEntry.create({ data: { id: input.id, kind: input.kind, creatorId: actorId, payload: details as unknown as Prisma.InputJsonValue } });
      after = details as unknown as Prisma.InputJsonValue;
    } else {
      const exceptions = { ...(old.exceptions as unknown as Entry["exceptions"]) };
      if (input.occurrence) {
        const base = old.payload as unknown as EventDetails;
        if (base.repeat === "NONE") throw new Error("This event does not repeat.");
        // Only a real occurrence may be overridden, never an arbitrary date supplied by a browser.
        const { expandEntries } = await import("./calendar-model");
        const day = input.occurrence.slice(0, 10);
        const { DateTime } = await import("luxon");
        const instances = expandEntries([{ id: old.id, kind: old.kind, revision: old.revision, payload: base, exceptions: {} }], [], [], DateTime.fromISO(day).minus({ days: 2 }).toISODate()!, DateTime.fromISO(day).plus({ days: 3 }).toISODate()!);
        if (!instances.some(instance => instance.key === input.occurrence)) throw new Error("Occurrence not found.");
        exceptions[input.occurrence] = details ? { ...details, repeat: "NONE", until: "" } : null;
      }
      const data = input.occurrence ? { exceptions: exceptions as unknown as Prisma.InputJsonValue } : input.remove ? { deletedAt: new Date() } : { payload: details as unknown as Prisma.InputJsonValue };
      const result = await tx.calendarEntry.updateMany({ where: { id: old.id, revision: input.revision!, deletedAt: null }, data: { ...data, revision: { increment: 1 } } });
      if (result.count !== 1) throw new Error("Someone changed this event. Close and reopen it before saving.");
      after = { action: input.remove ? "Deleted" : "Edited", scope: input.occurrence ?? "series", details: details as unknown as Prisma.InputJsonValue | null };
    }
    await tx.calendarAudit.create({ data: { actorId, recordId: input.id, recordType: input.kind, changes: { before: old ? { payload: old.payload, exceptions: old.exceptions } : null, after } } });
  }, { maxWait: 10_000, timeout: 30_000 });
}
function referencesPerson(payload: EventDetails, exceptions: Entry["exceptions"], id: string) {
  return payload.people.includes(id) || Object.values(exceptions).some(details => details?.people.includes(id));
}
function removePerson(details: EventDetails, id: string): EventDetails {
  const people = details.people.filter(person => person !== id);
  return { ...details, people, primaryPerson: people.includes(details.primaryPerson) ? details.primaryPerson : people[0] ?? "" };
}
async function personEvents(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.calendarEntry.findMany({ take: 10001, orderBy: { id: "asc" } });
  if (rows.length > 10000) throw new Error("Calendar deletion capacity reached. Contact the maintainer before deleting names.");
  return rows.filter(row => referencesPerson(row.payload as unknown as EventDetails, row.exceptions as unknown as Entry["exceptions"], id));
}
export async function calendarPersonDeletionPreview(db: PrismaClient, actorId: string, id: string) {
  if (!uuid(id)) throw new Error("Invalid person identifier.");
  return db.$transaction(async tx => {
    await admin(tx, actorId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('calendar-person-directory'))`;
    const person = await tx.calendarPerson.findUnique({ where: { id } });
    if (!person) throw new Error("This person was removed. Refresh Calendar Settings.");
    const rows = await personEvents(tx, id);
    const active = rows.filter(row => !row.deletedAt);
    const deleted = active.filter(row => { const details = row.payload as unknown as EventDetails; return details.people.length === 1 && details.people[0] === id; }).length;
    return { id, name: person.name, revision: person.revision, events: rows.map(row => ({ id: row.id, revision: row.revision })), affected: active.length, deleted, kept: active.length - deleted };
  }, { maxWait: 10_000, timeout: 30_000 });
}
export async function deleteCalendarPerson(db: PrismaClient, actorId: string, input: { id: string; revision: number; events: { id: string; revision: number }[] }) {
  if (!input || !uuid(input.id) || !Number.isSafeInteger(input.revision) || input.revision < 0 || !Array.isArray(input.events) || input.events.length > 10000 || input.events.some(row => !uuid(row?.id) || !Number.isSafeInteger(row.revision) || row.revision < 0) || new Set(input.events.map(row => row.id)).size !== input.events.length) throw new Error("Invalid deletion request.");
  await db.$transaction(async tx => {
    await admin(tx, actorId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('calendar-person-directory'))`;
    const person = await tx.calendarPerson.findUnique({ where: { id: input.id } });
    if (!person) {
      if (await tx.calendarAudit.findFirst({ where: { recordId: input.id, actorId, recordType: "person", changes: { path: ["action"], equals: "Deleted" } } })) return;
      throw new Error("This person was removed. Refresh Calendar Settings.");
    }
    const rows = await personEvents(tx, input.id);
    if (person.revision !== input.revision || !isDeepStrictEqual(rows.map(row => ({ id: row.id, revision: row.revision })), [...input.events].sort((a, b) => a.id.localeCompare(b.id)))) throw new Error("This person or their events changed. Review the deletion again before confirming.");
    for (const row of rows) {
      const oldPayload = row.payload as unknown as EventDetails, oldExceptions = row.exceptions as unknown as Entry["exceptions"];
      const payload = removePerson(oldPayload, input.id);
      const soleBase = oldPayload.people.length === 1 && oldPayload.people[0] === input.id;
      const exceptions = Object.fromEntries(Object.entries(oldExceptions).map(([key, details]) => [key, details && details.people.length === 1 && details.people[0] === input.id ? null : details ? removePerson(details, input.id) : null])) as Entry["exceptions"];
      // Keep surviving exceptions as independent events if their parent series is removed.
      if (soleBase && !row.deletedAt) {
        for (const [key, details] of Object.entries(exceptions)) {
          if (!details) continue;
          const retained = await tx.calendarEntry.create({ data: { id: randomUUID(), kind: row.kind, creatorId: row.creatorId, payload: { ...details, repeat: "NONE", until: "" } as unknown as Prisma.InputJsonValue } });
          await tx.calendarAudit.create({ data: { actorId, recordId: retained.id, recordType: row.kind, changes: { action: "Retained occurrence", sourceSeries: row.id, occurrence: key, details: retained.payload } } });
        }
      }
      const deletedAt = row.deletedAt ?? (soleBase ? new Date() : null);
      const changed = await tx.calendarEntry.updateMany({ where: { id: row.id, revision: row.revision }, data: { payload: payload as unknown as Prisma.InputJsonValue, exceptions: exceptions as unknown as Prisma.InputJsonValue, deletedAt, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new Error("This event changed. Review the deletion again.");
      await tx.calendarAudit.create({ data: { actorId, recordId: row.id, recordType: row.kind, changes: { action: "Person deleted", person: { id: person.id, name: person.name, color: person.color }, before: { payload: row.payload, exceptions: row.exceptions, deleted: !!row.deletedAt }, after: { payload: payload as unknown as Prisma.InputJsonValue, exceptions: exceptions as unknown as Prisma.InputJsonValue, deleted: !!deletedAt } } } });
    }
    await tx.calendarPerson.delete({ where: { id: input.id } });
    await tx.calendarAudit.create({ data: { actorId, recordId: input.id, recordType: "person", changes: { action: "Deleted", before: { name: person.name, color: person.color, active: person.active }, affectedEntries: rows.length } } });
  }, { maxWait: 10_000, timeout: 30_000 });
}
export async function saveCalendarSetting(db: PrismaClient, actorId: string, input: { type: "person" | "category"; id: string; revision: number | null; name: string; color: string; active: boolean }) {
  if (!input || !["person", "category"].includes(input.type) || !uuid(input.id) || typeof input.name !== "string" || !input.name.trim() || input.name.length > 200 || !colorValid(input.color) || typeof input.active !== "boolean" || (input.revision !== null && (!Number.isSafeInteger(input.revision) || input.revision < 0))) throw new Error("Enter a name and valid color.");
  await db.$transaction(async tx => {
    await admin(tx, actorId);
    if (input.type === "person") {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('calendar-person-directory'))`;
      const people = await tx.calendarPerson.findMany();
      if (people.some(person => person.id !== input.id && personKey(person.name) === personKey(input.name))) throw new Error("A person with this name already exists.");
    }
    const before = input.type === "person" ? await tx.calendarPerson.findUnique({ where: { id: input.id } }) : await tx.calendarCategory.findUnique({ where: { id: input.id } });
    const data = { name: input.name.trim(), color: input.color, active: input.active };
    if (input.revision === null) {
      if (before) { if (before.name === data.name && before.color === data.color && before.active === data.active) return; throw new Error("Setting already exists."); }
      if (input.type === "person") await tx.calendarPerson.create({ data: { id: input.id, ...data } });
      else await tx.calendarCategory.create({ data: { id: input.id, ...data } });
    } else {
      const args = { where: { id: input.id, revision: input.revision }, data: { ...data, revision: { increment: 1 } } };
      const result = input.type === "person" ? await tx.calendarPerson.updateMany(args) : await tx.calendarCategory.updateMany(args);
      if (result.count !== 1) throw new Error("This setting changed. Refresh and retry.");
    }
    await tx.calendarAudit.create({ data: { actorId, recordId: input.id, recordType: input.type, changes: { before: before ? { name: before.name, color: before.color, active: before.active } : null, after: data } } });
  }, { maxWait: 10_000, timeout: 30_000 });
}
