import { isDeepStrictEqual } from "node:util";
import type { PrismaClient } from "../generated/prisma/client";
import { isSuperAdminAccount } from "./super-admin-policy";
import { blackoutKind, validateBlackout, BlackoutError, type CalendarBlackout } from "./calendar-blackout-model";

const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function readCalendarBlackouts(db: PrismaClient): Promise<CalendarBlackout[]> {
  const rows = await db.calendarEntry.findMany({ where: { kind: blackoutKind, deletedAt: null }, orderBy: { id: "asc" }, take: 1001 });
  if (rows.length > 1000) throw new BlackoutError("Blackout capacity reached. Contact the maintainer.");
  return rows.map(row => ({ id: row.id, revision: row.revision, ...validateBlackout(row.payload) })).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end) || a.id.localeCompare(b.id));
}
export type BlackoutChange = { id: string; revision: number | null; details?: unknown; remove?: boolean };
export async function changeCalendarBlackout(db: PrismaClient, actorId: string, input: BlackoutChange) {
  if (!input || !uuid(input.id) || (input.revision !== null && (!Number.isSafeInteger(input.revision) || input.revision < 0)) || (input.remove !== undefined && typeof input.remove !== "boolean") || (input.remove && input.revision === null)) throw new BlackoutError("Invalid blackout request.");
  const details = input.remove ? null : validateBlackout(input.details);
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('calendar-vacation-blackouts'))`;
    const actor = await tx.appUser.findUnique({ where: { id: actorId } });
    if (!actor?.active || actor.role !== "ADMIN" || actor.loginDeletionRequestedAt || actor.loginDeletedAt || !isSuperAdminAccount(actor.email)) throw new BlackoutError("Only the Super Admin can manage vacation blackouts.");
    const old = await tx.calendarEntry.findUnique({ where: { id: input.id } });
    if (old && old.kind !== blackoutKind) throw new BlackoutError("This record is not a vacation blackout.");
    if (input.remove && old?.deletedAt) return;
    if (input.revision === null) {
      if (old) {
        if (!old.deletedAt && old.creatorId === actorId && isDeepStrictEqual(validateBlackout(old.payload), details)) return;
        throw new BlackoutError("This blackout request was already processed. Refresh to review it.");
      }
      if (await tx.calendarEntry.count({ where: { kind: blackoutKind, deletedAt: null } }) >= 1000) throw new BlackoutError("Blackout capacity reached. Remove an old range before adding another.");
    } else {
      if (!old || old.deletedAt) throw new BlackoutError("This blackout was removed. Refresh the calendar.");
      if (!input.remove && isDeepStrictEqual(validateBlackout(old.payload), details)) return;
      if (old.revision !== input.revision) throw new BlackoutError("This blackout changed. Your input is preserved. Close and reopen it before saving again.");
    }
    // Empty common participant fields keep older calendar readers compatible.
    const payload = details ? { ...details, people: [], primaryPerson: "" } : undefined;
    if (!old) await tx.calendarEntry.create({ data: { id: input.id, creatorId: actorId, kind: blackoutKind, payload: payload! } });
    else await tx.calendarEntry.update({ where: { id: old.id }, data: { ...(payload ? { payload } : {}), ...(input.remove ? { deletedAt: new Date() } : {}), revision: { increment: 1 } } });
    await tx.calendarAudit.create({ data: { actorId, recordId: input.id, recordType: blackoutKind, changes: { action: input.remove ? "Deleted" : old ? "Edited" : "Added", before: old ? validateBlackout(old.payload) : null, after: details, policy: "Notice only; time off is not blocked" } } });
  }, { maxWait: 10_000, timeout: 30_000 });
}
