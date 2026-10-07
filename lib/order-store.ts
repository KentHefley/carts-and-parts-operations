import { Prisma, PrismaClient } from "../generated/prisma/client";
import { fieldKeys, orderFields } from "./order-fields";
import { chicagoDate, conflicts, ItemValue, OrderView, SaveRequest } from "./order-types";

const include = { items: { orderBy: { position: "asc" as const } }, creator: { select: { email: true } } };
type StoredOrder = Prisma.SalesOrderGetPayload<{ include: typeof include }>;
export function orderView(order: StoredOrder): OrderView {
  return { id: order.id, number: `DEV-${String(order.number).padStart(6, "0")}`, creator: order.creator.email,
    fields: { ...(order.fields as Record<string, string>), name: order.name ?? "" },
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
    if (!fieldKeys.has(key) || typeof value !== "string" || value.length > 10_000) throw new Error("Invalid field value.");
    const field = orderFields.find(field => field.key === key);
    if (field?.options && value && !field.options.includes(value)) throw new Error(`Invalid ${field.label}.`);
    if (key === "status" && !["Pending", "In Progress", "Expedite"].includes(value)) throw new Error("Closeout is not available in this milestone.");
    if ((key === "dateEntered" || field?.type === "date") && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value)) throw new Error("Invalid date.");
    if (field?.type === "time" && value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error("Invalid time.");
    if (field?.type === "number" && value && !/^-?\d+(\.\d+)?$/.test(value)) throw new Error("Invalid number.");
  }
}

export async function saveOrder(database: PrismaClient, actorId: string, request: SaveRequest): Promise<{ ok: true; order: OrderView } | { ok: false; message: string; conflict?: string[] }> {
  if (!request || typeof request.id !== "string" || !request.patch || !request.base) throw new Error("Invalid save request.");
  validateFields(request.patch);
  try {
    if (request.items) validateItems(request.items);
    if (request.baseItems) validateItems(request.baseItems);
  } catch (error) {
    if (error instanceof InputError) return { ok: false as const, message: error.message };
    throw error;
  }
  return database.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${request.id}::uuid FOR UPDATE`;
    const order = await transaction.salesOrder.findUniqueOrThrow({ where: { id: request.id }, include });
    const current = orderView(order);
    const conflictingFields = conflicts(current.fields, request.base, request.patch);
    if (request.items && JSON.stringify(current.items) !== JSON.stringify(request.baseItems) && JSON.stringify(current.items) !== JSON.stringify(request.items)) conflictingFields.push("Item rows");
    if (conflictingFields.length) return { ok: false as const, conflict: conflictingFields, message: "Someone else changed these fields. Your input is preserved. Reload to review their saved values." };
    const next = { ...current.fields, ...request.patch };
    if (!next.name?.trim()) return { ok: false as const, message: "Name is required before saving." };
    if (!next.dateEntered) next.dateEntered = chicagoDate();
    const changes: Record<string, Prisma.InputJsonValue> = {};
    for (const key of Object.keys(next)) if (next[key] !== (current.fields[key] ?? "")) changes[key] = { before: current.fields[key] ?? "", after: next[key] };
    if (request.items && JSON.stringify(current.items) !== JSON.stringify(request.items)) changes.items = { before: current.items, after: request.items };
    if (!Object.keys(changes).length) return { ok: true as const, order: current };
    const { name, ...values } = next;
    await transaction.salesOrder.update({ where: { id: order.id }, data: { name, fields: values } });
    if (request.items && changes.items) {
      await transaction.orderItem.deleteMany({ where: { orderId: order.id } });
      await transaction.orderItem.createMany({ data: request.items.map((item, position) => ({ orderId: order.id, position, description: item.description, quantity: item.quantity || null, unitPrice: item.unitPrice || null })) });
    }
    await transaction.orderEvent.create({ data: { orderId: order.id, actorId, changes } });
    return { ok: true as const, order: orderView(await transaction.salesOrder.findUniqueOrThrow({ where: { id: order.id }, include })) };
  });
}

export async function loadOrder(database: PrismaClient, id: string) {
  return orderView(await database.salesOrder.findUniqueOrThrow({ where: { id }, include }));
}
