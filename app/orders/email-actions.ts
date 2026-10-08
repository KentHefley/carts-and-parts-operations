"use server";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { EmailInputError, queueOrderEmail, sendQueuedEmail } from "../../lib/order-email-store";
import type { OrderView } from "../../lib/order-types";
import { revalidatePath } from "next/cache";
import { EmailPolicyError } from "../../lib/email-config";

export async function sendSOEmail(request: { expected?: OrderView; requestKey?: string; messageId?: string }) {
  const actor = await requireApprovedUser();
  let messageId = request?.messageId;
  try {
    if (!messageId) {
      if (!request?.expected || !request.requestKey) throw new EmailInputError("Invalid email request.");
      messageId = await queueOrderEmail(getDatabase(), actor.id, request.expected, request.requestKey);
    }
    await sendQueuedEmail(getDatabase(), actor.id, messageId);
    revalidatePath("/activity");
    if (request.expected) revalidatePath(`/orders/${request.expected.id}/activity`);
    return { ok: true as const, messageId, message: "SO email accepted for sending. Check your inbox (and spam folder)." };
  } catch (error) {
    return { ok: false as const, messageId, message: error instanceof EmailInputError || error instanceof EmailPolicyError ? error.message : "Email could not be completed. Your order remains saved. Retry the saved attempt or check email configuration." };
  }
}
