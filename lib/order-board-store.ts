import { Prisma, type PrismaClient } from "../generated/prisma/client";
import { ORDER_BOARD_PAGE_SIZE, parseBoardQuery, type BoardCursor, type BoardFilters, type BoardPage, type BoardRow } from "./order-board-model";

type StoredRow = BoardRow & { sortDate: string; createdAt: Date };

export async function readOrderBoard(database: PrismaClient, actorId: string, input: BoardFilters, after: BoardCursor | null = null): Promise<BoardPage> {
  const { filters, cursor } = parseBoardQuery(input, after);
  // Only constant SQL fragments; all search values and cursor parts are parameters.
  const membership = filters.completed ? Prisma.sql`o.fields->>'status' IN ('Complete', 'Voided')` : Prisma.sql`o.fields->>'status' IN ('Pending', 'In Progress', 'Expedite')`;
  const date = filters.completed ? Prisma.sql`COALESCE(o.fields->>'statusChangedAt', '')` : Prisma.sql`COALESCE(o.fields->>'dateEntered', '')`;
  const where = Prisma.sql`o."deletedAt" IS NULL AND o.name IS NOT NULL AND ${membership}
    AND position(lower(${filters.name}) in lower(o.name)) > 0
    AND position(lower(${filters.number}) in lower('DEV-' || lpad(o.number::text, GREATEST(6, length(o.number::text)), '0'))) > 0
    ${filters.status ? Prisma.sql`AND o.fields->>'status' = ${filters.status}` : Prisma.empty}`;
  const boundary = cursor ? Prisma.sql`AND (${date}, o."createdAt", o.id) < (${cursor.date}, ${cursor.createdAt}::timestamp, ${cursor.id}::uuid)` : Prisma.empty;
  return database.$transaction(async tx => {
    const actor = await tx.appUser.findUnique({ where: { id: actorId } });
    if (!actor?.active || actor.loginDeletedAt || actor.loginDeletionRequestedAt) throw new Error("Approved access required.");
    const rows = await tx.$queryRaw<StoredRow[]>(Prisma.sql`
      SELECT o.id, 'DEV-' || lpad(o.number::text, GREATEST(6, length(o.number::text)), '0') AS number, o.name,
        o.fields->>'status' AS status, COALESCE(o.fields->>'division__1', '') AS division,
        COALESCE(o.fields->>'dropdown__1', '') AS "jobType", COALESCE(o.fields->>'start_job_date__1', '') AS scheduled,
        COALESCE((SELECT string_agg(COALESCE(NULLIF(u."displayName", ''), u.email) || CASE WHEN u.active THEN '' ELSE ' (inactive)' END, ', '
          ORDER BY lower(COALESCE(NULLIF(u."displayName", ''), u.email)), u.id)
          FROM "OrderAssignment" a JOIN "AppUser" u ON u.id = a."userId" WHERE a."orderId" = o.id), '') AS assigned,
        (${actor.role === "ADMIN"} OR (${!filters.completed} AND o."creatorId" = ${actorId}::uuid)) AS "canDelete",
        ${date} AS "sortDate", o."createdAt"
      FROM "SalesOrder" o WHERE ${where} ${boundary}
      ORDER BY ${date} DESC, o."createdAt" DESC, o.id DESC LIMIT ${ORDER_BOARD_PAGE_SIZE + 1}`);
    // Only the first page needs a matching total. Subsequent responses stay bounded.
    const total = cursor ? null : Number((await tx.$queryRaw<{ count: bigint }[]>(Prisma.sql`SELECT count(*) FROM "SalesOrder" o WHERE ${where}`))[0].count);
    const displayed = rows.slice(0, ORDER_BOARD_PAGE_SIZE);
    const last = displayed.at(-1);
    return {
      rows: displayed.map(row => ({ id: row.id, number: row.number, name: row.name, status: row.status, division: row.division, jobType: row.jobType, scheduled: row.scheduled, assigned: row.assigned, canDelete: row.canDelete })),
      total,
      nextCursor: rows.length > ORDER_BOARD_PAGE_SIZE && last ? { date: last.sortDate, createdAt: last.createdAt.toISOString(), id: last.id } : null,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
