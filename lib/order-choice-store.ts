import type { PrismaClient } from "../generated/prisma/client";
import { managedChoice, normalizeChoice } from "./order-choice-policy";
export class ChoiceError extends Error {}
type ChoiceEdit = { fieldKey: string; label: string } | { id: string; active: boolean; version: number } | { id: string; version: number; direction: "up" | "down"; neighborId: string; neighborVersion: number };
export function readOrderChoices(db: PrismaClient) {
  return db.orderChoice.findMany({ orderBy: [{ fieldKey: "asc" }, { position: "asc" }, { id: "asc" }] });
}
export async function changeOrderChoice(db: PrismaClient, actorId: string, input: ChoiceEdit) {
  if (!input || typeof input !== "object") throw new ChoiceError("Invalid choice settings.");
  if ("fieldKey" in input) {
    if (!managedChoice(input.fieldKey) || typeof input.label !== "string" || !input.label.trim() || input.label.length > 100 || /[\u0000-\u001f\u007f]/.test(input.label)) throw new ChoiceError("Choose a supported field and enter a choice of 1–100 characters.");
  } else {
    if (typeof input.id !== "string" || !/^[0-9a-f-]{36}$/i.test(input.id) || !Number.isInteger(input.version) || input.version < 1) throw new ChoiceError("Invalid choice settings.");
    if ("direction" in input) {
      if (!["up", "down"].includes(input.direction) || typeof input.neighborId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.neighborId) || !Number.isInteger(input.neighborVersion) || input.neighborVersion < 1) throw new ChoiceError("Invalid choice movement.");
    } else if (typeof input.active !== "boolean") throw new ChoiceError("Invalid choice settings.");
  }
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-dropdown-choices'))`;
    const actor = await tx.appUser.findUnique({ where: { id: actorId } });
    if (!actor?.active || actor.role !== "ADMIN" || actor.loginDeletionRequestedAt || actor.loginDeletedAt) throw new ChoiceError("Administrator access required.");
    if ("fieldKey" in input) {
      const label = input.label.trim().replace(/\s+/g, " ");
      const normalizedLabel = normalizeChoice(label);
      const existing = await tx.orderChoice.findUnique({ where: { fieldKey_normalizedLabel: { fieldKey: input.fieldKey, normalizedLabel } } });
      if (existing) throw new ChoiceError(existing.active ? "That choice already exists." : "That choice is inactive. Reactivate it below instead.");
      const last = await tx.orderChoice.aggregate({ where: { fieldKey: input.fieldKey }, _max: { position: true } });
      const choice = await tx.orderChoice.create({ data: { fieldKey: input.fieldKey, label, normalizedLabel, position: (last._max.position ?? -1) + 1 } });
      await tx.orderChoiceAudit.create({ data: { actorId, choiceId: choice.id, changes: { actor: actor.displayName || actor.email, fieldKey: choice.fieldKey, label, action: "Added" } } });
      return;
    }
    const choice = await tx.orderChoice.findUnique({ where: { id: input.id } });
    if (!choice || !managedChoice(choice.fieldKey)) throw new ChoiceError("Choice not found. Reload this page.");
    if ("direction" in input) {
      const active = await tx.orderChoice.findMany({ where: { fieldKey: choice.fieldKey, active: true }, orderBy: [{ position: "asc" }, { id: "asc" }] });
      const index = active.findIndex(row => row.id === choice.id);
      const nextIndex = index + (input.direction === "up" ? -1 : 1);
      const neighbor = index >= 0 ? active[nextIndex] : undefined;
      if (!choice.active || choice.version !== input.version || !neighbor || neighbor.id !== input.neighborId || neighbor.version !== input.neighborVersion) throw new ChoiceError("The choice order changed. Reload the page before moving it again.");
      await tx.orderChoice.update({ where: { id: choice.id }, data: { position: neighbor.position, version: { increment: 1 } } });
      await tx.orderChoice.update({ where: { id: neighbor.id }, data: { position: choice.position, version: { increment: 1 } } });
      await tx.orderChoiceAudit.create({ data: { actorId, choiceId: choice.id, changes: { actor: actor.displayName || actor.email, fieldKey: choice.fieldKey, label: choice.label, action: `Moved ${input.direction}`, beforePosition: index + 1, afterPosition: nextIndex + 1, swappedWith: neighbor.label } } });
      return;
    }
    if (choice.active === input.active) return;
    if (choice.version !== input.version) throw new ChoiceError("This choice changed. Reload the page before trying again.");
    await tx.orderChoice.update({ where: { id: choice.id }, data: { active: input.active, version: { increment: 1 } } });
    await tx.orderChoiceAudit.create({ data: { actorId, choiceId: choice.id, changes: { actor: actor.displayName || actor.email, fieldKey: choice.fieldKey, label: choice.label, action: input.active ? "Reactivated" : "Deactivated" } } });
  }, { maxWait: 10_000, timeout: 30_000 });
}
