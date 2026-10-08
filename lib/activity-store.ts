import { PrismaClient } from "../generated/prisma/client";
import { groupActivity } from "./activity-grouping";

export async function readActivity(database: PrismaClient, options: { orderId?: string; cursor?: string } = {}) {
  for (const id of [options.orderId, options.cursor]) {
    if (id !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid activity identifier.");
  }
  const fetchRows = (cursor?: string) => database.orderEvent.findMany({
      where: options.orderId ? { orderId: options.orderId } : { order: { name: { not: null } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { actor: { select: { displayName: true, email: true } }, order: { select: { id: true, number: true, name: true } } },
    });
  const [firstRows, users] = await Promise.all([
    fetchRows(options.cursor),
    database.appUser.findMany({ select: { id: true, displayName: true, email: true } }),
  ]);
  const rows = [...firstRows];
  let batch = firstRows;
  let groups = groupActivity(rows);
  // Read through the last displayed group so a typing session cannot split across pages.
  while (groups.length <= 20 && batch.length === 100) {
    batch = await fetchRows(batch[batch.length - 1].id);
    rows.push(...batch);
    groups = groupActivity(rows);
  }
  const events = groups.slice(0, 20);
  return { events, names: new Map(users.map(user => [user.id, user.displayName || user.email])), nextCursor: groups.length > 20 ? events[19].lastEventId : undefined };
}
