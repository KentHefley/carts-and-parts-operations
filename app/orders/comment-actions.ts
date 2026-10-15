"use server";
import { revalidatePath } from "next/cache";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { mutateComment, CommentError } from "../../lib/comment-store";
import type { CommentInput } from "../../lib/comment-types";
export async function saveComment(input: CommentInput) {
  const actor = await requireApprovedUser();
  try {
    const id = await mutateComment(getDatabase(), actor.id, input);
    for (const path of [`/orders/${input.orderId}/updates`, `/orders/${input.orderId}/activity`, "/activity"]) revalidatePath(path);
    return { ok: true as const, id };
  } catch (error) { return { ok: false as const, message: error instanceof CommentError ? error.message : "Could not confirm this comment change. Your input is preserved. Refresh Comments to review saved content before retrying." }; }
}
