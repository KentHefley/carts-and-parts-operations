"use server";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { copyOrder, reserveOrder, saveOrder } from "../../lib/order-store";
import { OrderView, SaveRequest } from "../../lib/order-types";
import { revalidatePath } from "next/cache";

export async function newOrder(requestKey: string) {
  const user = await requireApprovedUser();
  return reserveOrder(getDatabase(), user.id, requestKey);
}

export async function duplicateOrder(expected: OrderView, requestKey: string) {
  const user = await requireApprovedUser();
  const result = await copyOrder(getDatabase(), user.id, expected, requestKey);
  if (result.ok) { revalidatePath("/"); revalidatePath("/sales-orders"); revalidatePath("/activity"); }
  return result;
}

export async function persistOrder(request: SaveRequest) {
  const user = await requireApprovedUser();
  const result = await saveOrder(getDatabase(), user.id, request);
  if (result.ok) { revalidatePath("/"); revalidatePath("/sales-orders"); revalidatePath("/completed-orders"); revalidatePath("/activity"); revalidatePath(`/orders/${request.id}/activity`); }
  return result;
}
