"use server";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { deleteCustomField, FieldSettingsError, reviewFieldDeletion, saveFieldLayout } from "../../../lib/custom-field-store";
import type { FieldLayout } from "../../../lib/custom-field-model";
export async function saveFields(input: FieldLayout) {
  const actor = await requireSuperAdmin();
  try { const layout = await saveFieldLayout(getDatabase(), actor.id, input); revalidatePath("/administration/fields"); revalidatePath("/orders/[id]", "page"); return { layout }; }
  catch (error) { return { error: error instanceof FieldSettingsError ? error.message : "Could not save settings. Your preview is preserved; reload to review saved settings before retrying." }; }
}
export async function reviewDeleteField(key: string) {
  const actor = await requireSuperAdmin();
  try { return { review: await reviewFieldDeletion(getDatabase(), actor.id, key) }; }
  catch (error) { return { error: error instanceof FieldSettingsError ? error.message : "Could not review deletion." }; }
}
export async function deleteField(key: string, token: string) {
  const actor = await requireSuperAdmin();
  try { await deleteCustomField(getDatabase(), actor.id, key, token); revalidatePath("/administration/fields"); revalidatePath("/orders/[id]", "page"); return { layout: await (await import("../../../lib/custom-field-store")).readFieldLayout(getDatabase()) }; }
  catch (error) { return { error: error instanceof FieldSettingsError ? error.message : "Could not delete this field. Reload to review saved settings before retrying." }; }
}
