import { Prisma, PrismaClient } from "../generated/prisma/client";
import { isDeepStrictEqual } from "node:util";
import { type CalendarKind, type Entry, type EventDetails, validateDetails, uuid, colorValid } from "./calendar-model";
async function admin(tx: Prisma.TransactionClient, actorId: string) {
  const actor = await tx.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.role !== "ADMIN") throw new Error("Administrator access required.");
}
export async function calendarData(db: PrismaClient, kind: CalendarKind, signedInUserId: string) {
  const accounts = await db.appUser.findMany({ where: { id: signedInUserId, active: true }, select: { id: true, displayName: true, email: true } });
  const linked = await db.calendarPerson.findMany({ where: { userId: { in: accounts.map(user => user.id) } }, select: { userId: true } });
  const palette = ["#1764A0", "#A04B16", "#6446A0", "#14765C", "#A02E5C", "#566817"];
  const missing = accounts.filter(user => !linked.some(person => person.userId === user.id));
  if (missing.length) await db.calendarPerson.createMany({ data: missing.map(user => ({ userId: user.id, name: user.displayName || user.email, color: palette[parseInt(user.id.slice(0, 4), 16) % palette.length] })), skipDuplicates: true });
  const [people, categories, rows] = await Promise.all([db.calendarPerson.findMany({ orderBy: { name: "asc" } }), db.calendarCategory.findMany({ orderBy: { name: "asc" } }), db.calendarEntry.findMany({ where: { kind, deletedAt: null }, take: 1001 })]);
  if (rows.length > 1000) throw new Error("Calendar capacity reached. Contact an administrator.");
  return { people, categories, entries: rows.map(row => ({ id: row.id, kind: row.kind, revision: row.revision, payload: row.payload as unknown as EventDetails, exceptions: row.exceptions as unknown as Entry["exceptions"] })) };
}
export async function saveCalendarEntry(db: PrismaClient, actorId: string, input: { id: string; kind: CalendarKind; revision: number | null; details: unknown; occurrence?: string; remove?: boolean }) {
  if (!input || !uuid(input.id) || !["management", "employee"].includes(input.kind) || (input.revision !== null && (!Number.isSafeInteger(input.revision) || input.revision < 0)) || (input.occurrence && !/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d)?$/.test(input.occurrence))) throw new Error("Invalid calendar request.");
  const details = input.remove ? null : validateDetails(input.details);
  await db.$transaction(async tx => {
    await admin(tx, actorId);
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
  }, { timeout: 30_000 });
}
export async function saveCalendarSetting(db: PrismaClient, actorId: string, input: { type: "person" | "category"; id: string; revision: number | null; name: string; color: string; active: boolean }) {
  if (!input || !["person", "category"].includes(input.type) || !uuid(input.id) || typeof input.name !== "string" || !input.name.trim() || input.name.length > 200 || !colorValid(input.color) || typeof input.active !== "boolean" || (input.revision !== null && (!Number.isSafeInteger(input.revision) || input.revision < 0))) throw new Error("Enter a name and valid color.");
  await db.$transaction(async tx => {
    await admin(tx, actorId);
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
  }, { timeout: 30_000 });
}
