import { activeStatuses, terminalStatuses } from "./order-status";

export const ORDER_BOARD_PAGE_SIZE = 50;
export type BoardFilters = { completed: boolean; name: string; number: string; status: string };
export type BoardCursor = { date: string; createdAt: string; id: string };
export type BoardRow = { id: string; number: string; name: string; status: string; division: string; jobType: string; scheduled: string; assigned: string; canDelete: boolean };
export type BoardPage = { rows: BoardRow[]; nextCursor: BoardCursor | null; total: number | null };

export function parseBoardQuery(input: BoardFilters, cursor: BoardCursor | null = null) {
  if (!input || typeof input.completed !== "boolean" || [input.name, input.number, input.status].some(value => typeof value !== "string" || value.length > 200)) throw new Error("Invalid board filters.");
  if (input.status && !(input.completed ? terminalStatuses : activeStatuses).includes(input.status)) throw new Error("Invalid board status.");
  if (cursor !== null && (!cursor || typeof cursor !== "object" || typeof cursor.date !== "string" || cursor.date.length > 200 ||
    typeof cursor.createdAt !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(cursor.createdAt) || !Number.isFinite(Date.parse(cursor.createdAt)) ||
    typeof cursor.id !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(cursor.id))) throw new Error("Invalid board cursor.");
  return { filters: { ...input, name: input.name.trim(), number: input.number.trim() }, cursor };
}

// A concurrent edit can move an already-loaded row past the next cursor.
export function appendBoardRows(previous: BoardRow[], next: BoardRow[]) {
  const rows = new Map(previous.map(row => [row.id, row]));
  for (const row of next) rows.set(row.id, row);
  return [...rows.values()];
}
