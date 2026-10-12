"use server";
import { requireApprovedUser, requireAdmin } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { trashOrder, restoreOrder, purgeExpiredOrders } from "../../lib/trash-store";
import { attachmentStorage } from "../../lib/attachment-storage";
import { revalidatePath } from "next/cache";

function refresh(id?: string) {
  for (const path of ["/", "/sales-orders", "/completed-orders", "/administration/trash", "/activity", ...(id ? [`/orders/${id}`, `/orders/${id}/files`, `/orders/${id}/activity`] : [])]) revalidatePath(path);
}
export async function moveOrderToTrash(id: string) {
  const user = await requireApprovedUser();
  try { await trashOrder(getDatabase(), user.id, id); refresh(id); return { ok: true, message: "Order moved to Trash." }; }
  catch { return { ok: false, message: "Could not delete this order. Only its creator or an admin may delete it. If email is being sent, wait two minutes and retry." }; }
}
export async function restoreTrashedOrder(id: string) {
  const user = await requireAdmin();
  try { await restoreOrder(getDatabase(), user.id, id); refresh(id); return { ok: true, message: "Order restored with its previous status and assignments." }; }
  catch { return { ok: false, message: "Could not restore. The 30-day restoration period may have ended or permanent cleanup may have started." }; }
}
export async function cleanExpiredTrash() {
  await requireAdmin();
  try { const result = await purgeExpiredOrders(getDatabase(), attachmentStorage()); refresh(); return { ok: true, message: `Permanently cleaned ${result.purged} of ${result.checked} expired orders. Unfinished cleanup remains queued for retry.` }; }
  catch { return { ok: false, message: "Cleanup unavailable. Check development storage configuration and retry." }; }
}
