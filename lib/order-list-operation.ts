import type { PrismaClient } from "../generated/prisma/client";
import { copyOrder, loadOrder } from "./order-store";
import { trashOrder } from "./trash-store";

export type ListOperation = "copy" | "trash";
export type ListOperationResult = { ok: true; copied?: { id: string; number: string } } | { ok: false; message: string };

// Each order is its own transaction: partial results are explicit and retryable.
export async function operateOnListedOrder(database: PrismaClient, actorId: string, operation: ListOperation, id: string, requestKey?: string): Promise<ListOperationResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !["copy", "trash"].includes(operation)) return { ok: false, message: "Invalid order action." };
  try {
    if (operation === "trash") {
      await trashOrder(database, actorId, id, true);
      return { ok: true };
    }
    const result = await copyOrder(database, actorId, await loadOrder(database, id), requestKey ?? "", true);
    return result.ok ? { ok: true, copied: { id: result.order.id, number: result.order.number } } : result;
  } catch {
    return { ok: false, message: operation === "trash"
      ? "Could not move this order to Trash. Completed orders require an admin; active orders require their creator or an admin. Wait if an email is being sent, then retry."
      : "Could not copy this saved order. Retry this attempt; orders in Trash cannot be copied." };
  }
}
