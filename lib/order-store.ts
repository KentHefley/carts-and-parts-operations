import { Prisma, PrismaClient } from "../generated/prisma/client";
import { fieldKeys, orderFields } from "./order-fields";
import { chicagoDate, conflicts, ItemValue, OrderView, SaveRequest } from "./order-types";
import { notifyOrderChange } from "./notification-store";
import { missingCloseout, orderStatuses, protectedStatusFields, terminalStatus } from "./order-status";

const include = { items: { orderBy: { position: "asc" as const } }, creator: { select: { email: true, displayName: true } }, assignments: { orderBy: { userId: "asc" as const } } };
type StoredOrder = Prisma.SalesOrderGetPayload<{ include: typeof include }>;
export function orderView(order: StoredOrder): OrderView {
  return { id: order.id, number: `DEV-${String(order.number).padStart(6, "0")}`, creator: order.creator.displayName || order.creator.email,
    fields: { ...(order.fields as Record<string, string>), name: order.name ?? "" }, assigneeIds: order.assignments.map(assignment => assignment.userId),
    items: order.items.map(item => ({ description: item.description, quantity: item.quantity?.toString() ?? "", unitPrice: item.unitPrice?.toString() ?? "" })) };
}

export async function reserveOrder(database: PrismaClient, creatorId: string, requestKey: string) {
  if (!/^[0-9a-f-]{36}$/i.test(requestKey)) throw new Error("Invalid request identifier.");
  const existing = await database.salesOrder.findUnique({ where: { creatorId_requestKey: { creatorId, requestKey } }, include });
  if (existing) return orderView(existing);
  try {
    return orderView(await database.salesOrder.create({ data: { creatorId, requestKey, fields: { status: "In Progress", dateEntered: "" },
      items: { create: [0, 1, 2].map(position => ({ position })) },
      events: { create: { actorId: creatorId, changes: { event: "Number reserved" } } } }, include }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const retried = await database.salesOrder.findUnique({ where: { creatorId_requestKey: { creatorId, requestKey } }, include });
      if (retried) return orderView(retried);
    }
    throw error;
  }
}

class InputError extends Error {}
function validateItems(items: ItemValue[]) {
  if (!Array.isArray(items) || items.length < 3 || items.length > 200) throw new InputError("Use 3–200 item rows.");
  for (const item of items) {
    if (!item || typeof item.description !== "string" || item.description.length > 10_000) throw new InputError("Invalid item description.");
    for (const [key, places] of [["quantity", 6], ["unitPrice", 2]] as const) {
      if (typeof item[key] !== "string" || (item[key] !== "" && !new RegExp(`^-?\\d{1,14}(\\.\\d{1,${places}})?$`).test(item[key]))) throw new InputError(`Invalid ${key}; use at most ${places} decimal places.`);
    }
  }
}

function validateFields(fields: Record<string, string>) {
  for (const [key, value] of Object.entries(fields)) {
    if (protectedStatusFields.includes(key)) throw new InputError("Completion and void details are recorded automatically and cannot be edited.");
    if (!fieldKeys.has(key) || typeof value !== "string" || value.length > 10_000) throw new InputError("Invalid field value.");
    const field = orderFields.find(field => field.key === key);
    if (field?.options && value && !field.options.includes(value)) throw new InputError(`Invalid ${field.label}.`);
    if (key === "status" && !orderStatuses.includes(value)) throw new InputError("Invalid status.");
    if ((key === "dateEntered" || field?.type === "date") && value) {
      const date = new Date(value + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new InputError(`Invalid ${field?.label ?? "Date Entered"}.`);
    }
    if (field?.type === "time" && value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new InputError(`Invalid ${field.label}.`);
    if (field?.type === "number" && value && !/^-?\d+(\.\d+)?$/.test(value)) throw new InputError(`Invalid ${field.label}.`);
  }
}

export async function saveOrder(database: PrismaClient, actorId: string, request: SaveRequest): Promise<{ ok: true; order: OrderView } | { ok: false; message: string; conflict?: string[]; closeoutRequired?: boolean }> {
  if (!request || typeof request.id !== "string" || !request.patch || !request.base) throw new Error("Invalid save request.");
  try {
    validateFields(request.patch);
    if (request.closeoutMode !== undefined && (request.closeoutMode !== "quick" || !terminalStatus(request.patch.status))) throw new InputError("Quick close requires Complete or Voided status.");
    if (request.items) validateItems(request.items);
    if (request.baseItems) validateItems(request.baseItems);
    for (const ids of [request.assigneeIds, request.baseAssigneeIds]) if (ids !== undefined && (!Array.isArray(ids) || ids.some(id => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) || new Set(ids).size !== ids.length)) throw new InputError("Assignments must contain each user only once.");
    if (request.assigneeIds && !request.baseAssigneeIds) throw new InputError("Missing previous assignments.");
  } catch (error) {
    if (error instanceof InputError) return { ok: false as const, message: error.message };
    throw error;
  }
  return database.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${request.id}::uuid FOR UPDATE`;
    const order = await transaction.salesOrder.findUniqueOrThrow({ where: { id: request.id }, include });
    const current = orderView(order);
    const patch = { ...request.patch };
    if (request.closeoutMode === "quick") {
      if (current.fields.status === patch.status) {
        // A repeated quick-close request must retain the original recorded closeout.
        patch.text_79__1 = current.fields.text_79__1 ?? "";
        patch.closed_out_date4__1 = current.fields.closed_out_date4__1 ?? "";
      } else {
        const actor = await transaction.appUser.findUniqueOrThrow({ where: { id: actorId }, select: { email: true, displayName: true } });
        patch.text_79__1 = actor.displayName || actor.email;
        patch.closed_out_date4__1 = chicagoDate();
      }
    }
    const conflictingFields = conflicts(current.fields, request.base, patch);
    const assigneeIds = request.assigneeIds ? [...request.assigneeIds].sort() : current.assigneeIds;
    const assignmentChanged = JSON.stringify(assigneeIds) !== JSON.stringify(current.assigneeIds);
    if (request.assigneeIds && assignmentChanged && JSON.stringify(current.assigneeIds) !== JSON.stringify([...(request.baseAssigneeIds ?? [])].sort())) conflictingFields.push("Assigned To");
    if (request.items && JSON.stringify(current.items) !== JSON.stringify(request.baseItems) && JSON.stringify(current.items) !== JSON.stringify(request.items)) conflictingFields.push("Item rows");
    if (conflictingFields.length) return { ok: false as const, conflict: conflictingFields, message: "Someone else changed these fields. Your input is preserved. Reload to review their saved values." };
    const addedIds = assigneeIds.filter(id => !current.assigneeIds.includes(id));
    const activeAdded = await transaction.appUser.count({ where: { id: { in: addedIds }, active: true } });
    if (activeAdded !== addedIds.length) return { ok: false as const, message: "Only active approved users can be newly assigned." };
    const next = { ...current.fields, ...patch };
    if (!next.name?.trim()) return { ok: false as const, message: "Name is required before saving." };
    if (!next.dateEntered) next.dateEntered = chicagoDate();
    if (terminalStatus(next.status) && missingCloseout(next)) {
      return { ok: false as const, closeoutRequired: true, message: "Closed Out By and Closed Out Date are required for Complete or Voided." };
    }
    if (next.status !== current.fields.status) {
      const actor = await transaction.appUser.findUniqueOrThrow({ where: { id: actorId }, select: { email: true, displayName: true } });
      const timestamp = new Date().toISOString();
      next.statusChangedAt = timestamp;
      next.completedBy = next.status === "Complete" ? actor.displayName || actor.email : "";
      next.completionDate = next.status === "Complete" ? timestamp : "";
      next.voidedBy = next.status === "Voided" ? actor.displayName || actor.email : "";
      next.voidedDate = next.status === "Voided" ? timestamp : "";
      if (next.status !== "Voided") next.voidReason = "";
    }
    const changes: Record<string, Prisma.InputJsonValue> = {};
    for (const key of Object.keys(next)) if (next[key] !== (current.fields[key] ?? "")) changes[key] = { before: current.fields[key] ?? "", after: next[key] };
    if (request.items && JSON.stringify(current.items) !== JSON.stringify(request.items)) changes.items = { before: current.items, after: request.items };
    if (assignmentChanged) changes.assignments = { before: current.assigneeIds, after: assigneeIds };
    if (!Object.keys(changes).length) return { ok: true as const, order: current };
    const { name, ...values } = next;
    await transaction.salesOrder.update({ where: { id: order.id }, data: { name, fields: values } });
    if (request.items && changes.items) {
      await transaction.orderItem.deleteMany({ where: { orderId: order.id } });
      await transaction.orderItem.createMany({ data: request.items.map((item, position) => ({ orderId: order.id, position, description: item.description, quantity: item.quantity || null, unitPrice: item.unitPrice || null })) });
    }
    if (assignmentChanged) {
      await transaction.orderAssignment.deleteMany({ where: { orderId: order.id, userId: { notIn: assigneeIds } } });
      if (addedIds.length) await transaction.orderAssignment.createMany({ data: addedIds.map(userId => ({ orderId: order.id, userId })) });
    }
    await transaction.orderEvent.create({ data: { orderId: order.id, actorId, changes } });
    await notifyOrderChange(transaction, order.id, actorId, addedIds, Object.keys(changes).some(key => key !== "assignments"));
    return { ok: true as const, order: orderView(await transaction.salesOrder.findUniqueOrThrow({ where: { id: order.id }, include })) };
  });
}

export async function loadOrder(database: PrismaClient, id: string) {
  return orderView(await database.salesOrder.findUniqueOrThrow({ where: { id }, include }));
}

export async function listOrders(database: PrismaClient, completed: boolean) {
  const statuses = completed ? ["Complete", "Voided"] : ["Pending", "In Progress", "Expedite"];
  return database.salesOrder.findMany({
    where: { name: { not: null }, OR: statuses.map(status => ({ fields: { path: ["status"], equals: status } })) },
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, name: true, fields: true, assignments: { include: { user: { select: { email: true, displayName: true, active: true } } } } },
  });
}
