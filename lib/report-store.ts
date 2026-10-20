import { PrismaClient } from "../generated/prisma/client";
import { buildReport, reportStatuses, type ReportFilter } from "./report-model";

export async function loadReport(db: PrismaClient, actorId: string, filter: ReportFilter) {
  const actor = await db.appUser.findUnique({ where: { id: actorId }, select: { active: true, role: true } });
  if (!actor?.active || actor.role !== "ADMIN") throw new Error("Administrator access is required for reports.");
  const orders = await db.salesOrder.findMany({
    where: { deletedAt: null, name: { not: null }, AND: [
      { fields: { path: ["dateEntered"], gte: filter.from } },
      { fields: { path: ["dateEntered"], lte: filter.to } },
      { OR: reportStatuses(filter.status).map(status => ({ fields: { path: ["status"], equals: status } })) },
    ] }, take: 5001,
    include: { items: { orderBy: { position: "asc" } }, assignments: { include: { user: { select: { displayName: true, email: true } } } } },
  });
  if (orders.length > 5000) throw new Error("More than 5,000 orders fall within this range. Narrow the dates; no partial totals are shown.");
  return buildReport(orders, filter);
}
