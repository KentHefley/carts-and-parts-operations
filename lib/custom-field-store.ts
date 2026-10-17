import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { customKey, customTypes, defaultLayout, employeeIds, formSections, includeHoursWorked, type FieldLayout, type LayoutField } from "./custom-field-model";

type Tx = Prisma.TransactionClient;
export class FieldSettingsError extends Error {}
export async function lockFields(tx: Tx) { await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-custom-fields'))`; }
export async function readFieldLayout(db: PrismaClient | Tx): Promise<FieldLayout> {
  const record = await db.orderFieldLayout.findUnique({ where: { id: "orders" } });
  return record ? { version: record.version, fields: includeHoursWorked(record.definitions as unknown as LayoutField[]) } : defaultLayout();
}
async function administrator(tx: Tx, actorId: string) {
  const actor = await tx.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.role !== "ADMIN" || actor.loginDeletionRequestedAt || actor.loginDeletedAt) throw new FieldSettingsError("Administrator access required.");
  return actor.displayName || actor.email;
}
export async function writeLayout(tx: Tx, layout: FieldLayout) {
  await tx.orderFieldLayout.upsert({ where: { id: "orders" }, create: { id: "orders", version: layout.version + 1, definitions: layout.fields }, update: { version: layout.version + 1, definitions: layout.fields } });
}
export async function saveFieldLayout(db: PrismaClient, actorId: string, input: FieldLayout) {
  if (!input || !Number.isInteger(input.version) || !Array.isArray(input.fields) || input.fields.length > 300) throw new FieldSettingsError("Invalid field layout.");
  return db.$transaction(async tx => {
    await lockFields(tx);
    const actor = await administrator(tx, actorId), current = await readFieldLayout(tx);
    if (current.version !== input.version) throw new FieldSettingsError("Settings changed. Reload before trying again.");
    if (new Set(input.fields.map(field => field.key)).size !== input.fields.length || current.fields.some(old => !input.fields.some(field => field.key === old.key))) throw new FieldSettingsError("Use the separate deletion control to remove custom fields.");
    const fields: LayoutField[] = [];
    for (const candidate of input.fields) {
      const old = current.fields.find(field => field.key === candidate.key);
      if (old?.deleted) { fields.push(old); continue; }
      if (typeof candidate.label !== "string" || !candidate.label.trim() || candidate.label.length > 100 || typeof candidate.help !== "string" || candidate.help.length > 500 || !formSections.includes(candidate.section) || typeof candidate.active !== "boolean" || !Array.isArray(candidate.options) || candidate.options.length > 100 || candidate.options.some(option => typeof option !== "string" || !option.trim() || option.length > 100)) throw new FieldSettingsError("Use a label of 1–100 characters, help up to 500 characters and valid section/choices.");
      if ((!old && !customKey(candidate.key)) || ((old?.custom ?? true) && !customTypes.includes(candidate.type as typeof customTypes[number]))) throw new FieldSettingsError("Invalid field type or identifier.");
      if (old && !old.custom && (candidate.type !== old.type || !candidate.active || candidate.section !== old.section || JSON.stringify(candidate.options) !== JSON.stringify(old.options))) throw new FieldSettingsError("Core field types, sections, choices and behavior are protected.");
      if (old?.used && candidate.type !== old.type) throw new FieldSettingsError(`${old.label} has been used. Create a replacement field instead.`);
      const options = candidate.options.map(value => value.trim());
      if (new Set(options.map(value => value.toLowerCase().replace(/\s+/g, " "))).size !== options.length) throw new FieldSettingsError("Dropdown choices must be unique.");
      const next: LayoutField = { key: candidate.key, label: candidate.label.trim(), help: candidate.help.trim(), section: candidate.section, type: candidate.type, options, active: candidate.active, custom: old?.custom ?? true, used: old?.used ?? false, revision: old?.revision ?? 1 };
      if (old && JSON.stringify({ ...old, revision: 0 }) !== JSON.stringify({ ...next, revision: 0 })) next.revision++;
      fields.push(next);
    }
    if (JSON.stringify(fields) === JSON.stringify(current.fields)) return current;
    const next = { version: current.version, fields };
    await writeLayout(tx, next);
    await tx.orderFieldAudit.create({ data: { actorId, changes: { actor, action: "Saved field layout", before: current.fields, after: fields } } });
    return { ...next, version: current.version + 1 };
  }, { timeout: 30_000 });
}
async function affectedOrders(tx: Tx, key: string) {
  return tx.$queryRaw<{ id: string; fields: Prisma.JsonValue }[]>`SELECT id, fields FROM "SalesOrder" WHERE "purgedAt" IS NULL AND COALESCE(fields->>${key}, '') <> '' ORDER BY id FOR UPDATE`;
}
function deletionToken(version: number, key: string, orders: Awaited<ReturnType<typeof affectedOrders>>) {
  return createHash("sha256").update(JSON.stringify([version, key, orders.map(order => [order.id, (order.fields as Record<string, string>)[key]])])).digest("hex");
}
export async function reviewFieldDeletion(db: PrismaClient, actorId: string, key: string) {
  return db.$transaction(async tx => {
    await lockFields(tx); await administrator(tx, actorId);
    const layout = await readFieldLayout(tx), field = layout.fields.find(field => field.key === key && !field.deleted);
    if (!field?.custom) throw new FieldSettingsError("Only custom fields can be deleted.");
    const orders = await affectedOrders(tx, key);
    return { count: orders.length, token: deletionToken(layout.version, key, orders), label: field.label };
  });
}
export async function deleteCustomField(db: PrismaClient, actorId: string, key: string, token: string) {
  return db.$transaction(async tx => {
    await lockFields(tx); const actor = await administrator(tx, actorId);
    const layout = await readFieldLayout(tx), field = layout.fields.find(field => field.key === key && !field.deleted);
    if (!field?.custom) throw new FieldSettingsError("Only custom fields can be deleted.");
    const orders = await affectedOrders(tx, key);
    if (token !== deletionToken(layout.version, key, orders)) throw new FieldSettingsError("Values or settings changed. Review the affected-order count again.");
    for (const order of orders) {
      await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${order.id}::uuid FOR UPDATE`;
      const values = { ...(order.fields as Record<string, string>) }, before = values[key]; delete values[key];
      await tx.salesOrder.update({ where: { id: order.id }, data: { fields: values } });
      await tx.orderEvent.create({ data: { orderId: order.id, actorId, changes: { event: "Custom field deleted", [key]: { label: field.label, type: field.type, before, after: "" } } } });
    }
    field.deleted = true; field.active = false; field.revision++;
    await tx.orderFieldAmount.deleteMany({ where: { fieldKey: key } });
    await writeLayout(tx, layout);
    await tx.orderFieldAudit.create({ data: { actorId, changes: { actor, action: "Deleted custom field", label: field.label, key, affectedOrders: orders.length } } });
  }, { timeout: 60_000 });
}

export async function validateCustomPatch(tx: Tx, layout: FieldLayout, patch: Record<string, string>, current: Record<string, string>, versions: Record<string, number> = {}) {
  if (!versions || typeof versions !== "object" || Array.isArray(versions)) throw new FieldSettingsError("Invalid field versions.");
  for (const [key, raw] of Object.entries(patch)) {
    if (!key.startsWith("custom_")) continue;
    const field = layout.fields.find(field => field.key === key);
    if (!field || field.deleted || !field.active || versions[key] !== field.revision) throw new FieldSettingsError("This field's settings changed. Reload the order to review the current fields.");
    if (typeof raw !== "string" || raw.length > 10_000) throw new FieldSettingsError(`Invalid ${field.label}.`);
    if (!raw) continue;
    if (field.type === "select" && raw !== current[key] && !field.options.includes(raw)) throw new FieldSettingsError(`${field.label}: select a current choice.`);
    if (field.type === "number" && !/^-?\d{1,20}(\.\d{1,6})?$/.test(raw)) throw new FieldSettingsError(`${field.label}: enter a number with up to six decimal places.`);
    if (field.type === "currency") {
      const amount = raw.trim().replace(/^\$/, "");
      if (!/^-?\d{1,14}(\.\d{1,6})?$/.test(amount)) throw new FieldSettingsError(`${field.label}: enter an amount such as 25, 25.00 or $25.`);
      patch[key] = new Prisma.Decimal(amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2);
    }
    if (field.type === "checkbox" && !["true", "false"].includes(raw)) throw new FieldSettingsError(`Invalid ${field.label}.`);
    if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) throw new FieldSettingsError(`Invalid ${field.label}.`);
    if (field.type === "date") {
      const date = new Date(`${raw}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) throw new FieldSettingsError(`Invalid ${field.label}.`);
    }
    if (field.type === "employees") {
      let ids: string[]; try { ids = employeeIds(raw); } catch { throw new FieldSettingsError(`Invalid ${field.label}.`); }
      const previous = employeeIds(current[key] ?? "");
      const added = ids.filter(id => !previous.includes(id));
      if (await tx.appUser.count({ where: { id: { in: added }, active: true, loginDeletedAt: null, loginDeletionRequestedAt: null } }) !== added.length) throw new FieldSettingsError(`${field.label}: select active employees only.`);
      patch[key] = ids.length ? JSON.stringify(ids.sort()) : "";
    }
  }
}
