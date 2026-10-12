"use server";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { attachmentStorage } from "../../lib/attachment-storage";
import { beginAttachment, finishAttachment, deleteAttachment, cleanupAttachments } from "../../lib/attachment-store";
import { revalidatePath } from "next/cache";

function refresh(orderId: string) {
  for (const path of [`/orders/${orderId}/files`, `/orders/${orderId}/activity`, "/activity", "/"]) revalidatePath(path);
}
export async function startFile(orderId: string, requestKey: string, filename: string, size: number) {
  const actor = await requireApprovedUser();
  try { return { ok: true as const, ...await beginAttachment(getDatabase(), attachmentStorage(), actor.id, orderId, requestKey, filename, size) }; }
  catch { return { ok: false as const, message: "Could not start upload. Check file type/size, your assignment, and storage configuration." }; }
}
export async function completeFile(orderId: string, id: string) {
  const actor = await requireApprovedUser();
  try { await finishAttachment(getDatabase(), attachmentStorage(), actor.id, orderId, id); refresh(orderId); return { ok: true }; }
  catch { return { ok: false, message: "Upload could not be verified. It may have expired, failed type/size checks, or your assignment changed. Retry verification or upload again." }; }
}
export async function removeFile(orderId: string, id: string) {
  const actor = await requireApprovedUser();
  try { const cleaned = await deleteAttachment(getDatabase(), attachmentStorage(), actor.id, orderId, id); refresh(orderId); return { ok: true, message: cleaned ? "File deleted." : "File removed from access; storage cleanup is pending. An admin can retry cleanup." }; }
  catch { return { ok: false, message: "Could not delete file. Only assigned employees and admins may delete files." }; }
}
export async function retryFileCleanup() {
  const actor = await requireApprovedUser();
  if (actor.role !== "ADMIN") return { ok: false, message: "Administrator access required." };
  try { const result = await cleanupAttachments(getDatabase(), attachmentStorage()); return { ok: true, message: `Cleanup processed ${result.cleaned} of ${result.checked} pending records.` }; }
  catch { return { ok: false, message: "Cleanup unavailable. Check storage configuration and retry." }; }
}
