"use server";
import { requireAdmin } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { saveCalendarEntry, saveCalendarSetting } from "../../lib/calendar-store";
import { revalidatePath } from "next/cache";
export async function saveEvent(input: Parameters<typeof saveCalendarEntry>[2]) {
  const actor = await requireAdmin();
  try { await saveCalendarEntry(getDatabase(), actor.id, input); revalidatePath("/calendar"); revalidatePath("/employee-calendar"); return { ok: true, message: input.remove ? "Event deleted." : "Event saved." }; }
  catch(error) { return { ok: false, message: error instanceof Error && /Choose|Enter|Invalid|event|changed|occurrence|repeat|clock|time zone|setting/i.test(error.message) ? error.message : "Could not save. Your input is preserved; retry later." }; }
}
export async function saveSetting(input: Parameters<typeof saveCalendarSetting>[2]) {
  const actor = await requireAdmin();
  try { await saveCalendarSetting(getDatabase(), actor.id, input); revalidatePath("/calendar"); revalidatePath("/employee-calendar"); return { ok: true, message: "Setting saved." }; }
  catch { return { ok: false, message: "Could not save. Check the name/color, or refresh if someone changed this setting." }; }
}
