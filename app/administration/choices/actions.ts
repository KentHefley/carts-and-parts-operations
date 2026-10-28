"use server";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { changeOrderChoice, ChoiceError } from "../../../lib/order-choice-store";
export async function saveChoice(input: Parameters<typeof changeOrderChoice>[2]) {
  const actor = await requireSuperAdmin();
  try { await changeOrderChoice(getDatabase(), actor.id, input); }
  catch (error) { return { error: error instanceof ChoiceError ? error.message : "Could not save this choice. Reload to review its current state before retrying." }; }
  revalidatePath("/administration/choices");
  revalidatePath("/orders/[id]", "page");
  return { error: "" };
}
