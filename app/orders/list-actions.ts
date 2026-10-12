"use server";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { operateOnListedOrder, type ListOperation } from "../../lib/order-list-operation";
import { revalidatePath } from "next/cache";

export async function applyOrderListAction(operation: ListOperation, id: string, requestKey?: string) {
  const user = await requireApprovedUser();
  const result = await operateOnListedOrder(getDatabase(), user.id, operation, id, requestKey);
  if (result.ok) {
    for (const path of ["/", "/sales-orders", "/completed-orders", "/activity", "/administration/trash"]) revalidatePath(path);
    if (operation === "trash") {
      for (const path of [`/orders/${id}`, `/orders/${id}/files`, `/orders/${id}/activity`]) revalidatePath(path);
    }
  }
  return result;
}
