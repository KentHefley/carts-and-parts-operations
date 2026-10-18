import { Prisma, PrismaClient } from "../generated/prisma/client";
import { fieldKeys, orderFields } from "./order-fields";
import { chicagoDate, conflicts, ItemValue, OrderView, SaveRequest } from "./order-types";
import { notifyOrderChange } from "./notification-store";
import { missingCloseout, orderStatuses, protectedStatusFields, terminalStatus } from "./order-status";
import { managedChoice } from "./order-choice-policy";
import { FieldSettingsError, lockFields, readFieldLayout, validateCustomPatch, writeLayout } from "./custom-field-store";
import { customKey } from "./custom-field-model";
import { itemNumberErrors, normalizeUnitPrice } from "./item-price";

const include = { customAmounts: true, items: { orderBy: { position: "asc" as const } }, creator: { select: { email: true, displayName: true } }, assignments: { orderBy: { userId: "asc" as const } } };
type StoredOrder = Prisma.SalesOrderGetPayload<{ include: typeof include }>;
export function orderView(order: StoredOrder): OrderView {
  return { id: order.id, number: `DEV-${String(order.number).padStart(6, "0")}`, creator: order.creator.displayName || order.creator.email,
    fields: { ...(order.fields as Record<string, string>), ...Object.fromEntries(order.customAmounts.map(value => [value.fieldKey, value.amount.toFixed(2)])), name: order.name ?? "" }, assigneeIds: order.assignments.map(assignment => assignment.userId),
    items: order.items.map(item => ({ description: item.description, quantity: item.quantity?.toString() ?? "", unitPrice: item.unitPrice?.toString() ?? "" })) };
}

export async function reserveOrder(database: PrismaClient, creatorId: string, requestKey: string) {
  if (!/^[0-9a-f-]{36}$/i.test(requestKey)) throw new Error("Invalid request identifier.");
  const existing = await database.salesOrder.findUnique({ where: { creatorId_requestKey: { creatorId, requestKey } }, include });
  if (existing) { if (existing.deletedAt) throw new Error("This order is in Trash."); return orderView(existing); }
  try {
    return orderView(await database.salesOrder.create({ data: { creatorId, requestKey, fields: { status: "In Progress", dateEntered: "" },
      items: { create: [0, 1, 2].map(position => ({ position })) },
      events: { create: { actorId: creatorId, changes: { event: "Number reserved" } } } }, include }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const retried = await database.salesOrder.findUnique({ where: { creatorId_requestKey: { creatorId, requestKey } }, include });
      if (retried) { if (retried.deletedAt) throw new Error("This order is in Trash."); return orderView(retried); }
    }
    throw error;
  }
}

class InputError extends Error {}

export async function copyOrder(database: PrismaClient, actorId: string, expected: OrderView, requestKey: string, activeOnly = false) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!expected || !uuid.test(expected.id) || typeof requestKey !== "string" || !uuid.test(requestKey)) return { ok: false as const, message: "Invalid copy request." };
  return database.$transaction(async transaction => {
    // Serialize repeated attempts from this user without allocating extra numbers.
    await lockFields(transaction);
    await transaction.$queryRaw`SELECT id FROM "AppUser" WHERE id = ${actorId}::uuid FOR UPDATE`;
    const actor = await transaction.appUser.findUnique({ where: { id: actorId } });
    if (!actor?.active) return { ok: false as const, message: "Active approved access is required to copy an order." };
    await transaction.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${expected.id}::uuid FOR UPDATE`;
    const source = await transaction.salesOrder.findUnique({ where: { id: expected.id }, include });
    if (!source || source.deletedAt || !source.name?.trim()) return { ok: false as const, message: "Only a saved order outside Trash can be copied." };
    const current = orderView(source);
    if (activeOnly && terminalStatus(current.fields.status)) return { ok: false as const, message: "Completed orders cannot be copied from the order list." };
    const event = `Copied from ${current.number}`;
    const existing = await transaction.salesOrder.findUnique({ where: { creatorId_requestKey: { creatorId: actorId, requestKey } }, include });
    if (existing) {
      const creation = await transaction.orderEvent.findFirst({ where: { orderId: existing.id, changes: { path: ["event"], equals: event } } });
      if (existing.deletedAt || !creation) return { ok: false as const, message: "This copy attempt is no longer available. Reload the order before starting another copy." };
      return { ok: true as const, order: orderView(existing) };
    }
    const sameFields = (left: Record<string, string>, right: Record<string, string>) => Object.keys({ ...left, ...right }).every(key => (left[key] ?? "") === (right[key] ?? ""));
    if (!expected.fields || !sameFields(current.fields, expected.fields) || JSON.stringify(current.items) !== JSON.stringify(expected.items) || JSON.stringify(current.assigneeIds) !== JSON.stringify(expected.assigneeIds)) {
      return { ok: false as const, message: "This order changed before it could be copied. Reload saved values, review the changes, and try again." };
    }
    const { name, ...fields } = current.fields;
    const layout = await readFieldLayout(transaction);
    for (const field of layout.fields) if (field.custom && (field.type === "employees" || field.deleted)) delete fields[field.key];
    for (const key of ["division__1", "text_28__1", "start_job_date__1", "text_79__1", "closed_out_date4__1", "voidReason", ...protectedStatusFields]) fields[key] = "";
    fields.status = "In Progress";
    fields.dateEntered = chicagoDate();
    const created = await transaction.salesOrder.create({ data: {
      creatorId: actorId, requestKey, name, fields,
      customAmounts: { create: source.customAmounts.filter(value => !layout.fields.some(field => field.key === value.fieldKey && field.deleted)).map(value => ({ fieldKey: value.fieldKey, amount: value.amount })) },
      items: { create: source.items.map(item => ({ position: item.position, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })) },
      events: { create: { actorId, changes: { event } } },
    }, include });
    return { ok: true as const, order: orderView(created) };
  }, { timeout: 30_000 });
}

function validateItems(items: ItemValue[]) {
  if (!Array.isArray(items) || items.length < 3 || items.length > 200) throw new InputError("Use 3–200 item rows.");
  for (const item of items) {
    if (!item || typeof item.description !== "string" || item.description.length > 10_000) throw new InputError("Invalid item description.");
  }
  const error = itemNumberErrors(items)[0];
  if (error) throw new InputError(`Item ${error.index + 1} ${error.field === "unitPrice" ? "Unit Price" : "Quantity"}: ${error.message}`);
}

function validateFields(fields: Record<string, string>) {
  for (const [key, value] of Object.entries(fields)) {
    if (customKey(key)) { if (typeof value !== "string" || value.length > 10_000) throw new InputError("Invalid custom field value."); continue; }
    if (protectedStatusFields.includes(key)) throw new InputError("Completion and void details are recorded automatically and cannot be edited.");
    if (!fieldKeys.has(key) || typeof value !== "string" || value.length > 10_000) throw new InputError("Invalid field value.");
    const field = orderFields.find(field => field.key === key);
    if (field?.options && !managedChoice(key) && value && !field.options.includes(value)) throw new InputError(`Invalid ${field.label}.`);
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
    // Normalize both sides before conflict comparisons, audit snapshots and decimal persistence.
    const normalized = (items: ItemValue[]) => items.map(item => ({ ...item, unitPrice: normalizeUnitPrice(item.unitPrice)! }));
    request = { ...request, ...(request.items ? { items: normalized(request.items) } : {}), ...(request.baseItems ? { baseItems: normalized(request.baseItems) } : {}) };
    for (const ids of [request.assigneeIds, request.baseAssigneeIds]) if (ids !== undefined && (!Array.isArray(ids) || ids.some(id => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) || new Set(ids).size !== ids.length)) throw new InputError("Assignments must contain each user only once.");
    if (request.assigneeIds && !request.baseAssigneeIds) throw new InputError("Missing previous assignments.");
  } catch (error) {
    if (error instanceof InputError) return { ok: false as const, message: error.message };
    throw error;
  }
  return database.$transaction(async transaction => {
    await lockFields(transaction);
    if (Object.keys(request.patch).some(managedChoice)) await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-dropdown-choices'))`;
    await transaction.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${request.id}::uuid FOR UPDATE`;
    const order = await transaction.salesOrder.findUniqueOrThrow({ where: { id: request.id }, include });
    if (order.deletedAt) return { ok: false as const, message: "This order is in Trash and cannot be edited." };
    const current = orderView(order);
    const layout = await readFieldLayout(transaction);
    for (const [key, value] of Object.entries(request.patch)) {
      if (!managedChoice(key) || !value || value === (current.fields[key] ?? "")) continue;
      const available = await transaction.orderChoice.findFirst({ where: { fieldKey: key, label: value, active: true } });
      if (!available) return { ok: false as const, message: `${orderFields.find(field => field.key === key)?.label}: that choice is no longer available. Reload saved values to get the current choices, then select an active choice.` };
    }
    const patch = { ...request.patch };
    try { await validateCustomPatch(transaction, layout, patch, current.fields, request.fieldVersions); }
    catch (error) { if (error instanceof FieldSettingsError) return { ok: false as const, message: error.message }; throw error; }
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
    let newlyUsed = false;
    for (const field of layout.fields.filter(field => field.custom)) {
      if (changes[field.key]) changes[field.key] = { before: current.fields[field.key] ?? "", after: next[field.key], label: field.label, type: field.type };
      if (!field.used && next[field.key]) { field.used = true; newlyUsed = true; }
    }
    if (request.items && JSON.stringify(current.items) !== JSON.stringify(request.items)) changes.items = { before: current.items, after: request.items };
    if (assignmentChanged) changes.assignments = { before: current.assigneeIds, after: assigneeIds };
    if (!Object.keys(changes).length) return { ok: true as const, order: current };
    const { name, ...values } = next;
    await transaction.salesOrder.update({ where: { id: order.id }, data: { name, fields: values } });
    // Decimal columns are authoritative; JSON retains the exact display value for
    // existing field snapshots/deletion queries, updated in this same transaction.
    for (const field of layout.fields.filter(field => field.custom && field.type === "currency" && field.key in patch)) {
      if (patch[field.key]) await transaction.orderFieldAmount.upsert({ where: { orderId_fieldKey: { orderId: order.id, fieldKey: field.key } }, create: { orderId: order.id, fieldKey: field.key, amount: patch[field.key] }, update: { amount: patch[field.key] } });
      else await transaction.orderFieldAmount.deleteMany({ where: { orderId: order.id, fieldKey: field.key } });
    }
    if (newlyUsed) await writeLayout(transaction, layout);
    if (request.items && changes.items) {
      await transaction.orderItem.deleteMany({ where: { orderId: order.id } });
      await transaction.orderItem.createMany({ data: request.items.map((item, position) => ({ orderId: order.id, position, description: item.description, quantity: item.quantity || null, unitPrice: item.unitPrice || null })) });
    }
    if (assignmentChanged) {
      await transaction.orderAssignment.deleteMany({ where: { orderId: order.id, userId: { notIn: assigneeIds } } });
      if (addedIds.length) await transaction.orderAssignment.createMany({ data: addedIds.map(userId => ({ orderId: order.id, userId })) });
    }
    await transaction.orderEvent.create({ data: { orderId: order.id, actorId, changes } });
    await notifyOrderChange(transaction, order.id, actorId, addedIds, Object.keys(changes).some(key => key !== "assignments" && !layout.fields.some(field => field.key === key && field.custom && field.type === "employees")));
    return { ok: true as const, order: orderView(await transaction.salesOrder.findUniqueOrThrow({ where: { id: order.id }, include })) };
  }, { timeout: 30_000 });
}

export async function loadOrder(database: PrismaClient, id: string) {
  return orderView(await database.salesOrder.findFirstOrThrow({ where: { id, deletedAt: null }, include }));
}

export async function listOrders(database: PrismaClient, completed: boolean) {
  const statuses = completed ? ["Complete", "Voided"] : ["Pending", "In Progress", "Expedite"];
  return database.salesOrder.findMany({
    where: { deletedAt: null, name: { not: null }, OR: statuses.map(status => ({ fields: { path: ["status"], equals: status } })) },
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, name: true, fields: true, creatorId: true, assignments: { include: { user: { select: { email: true, displayName: true, active: true } } } } },
  });
}
