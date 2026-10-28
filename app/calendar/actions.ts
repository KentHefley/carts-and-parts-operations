"use server";
import { requireAdmin } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { saveCalendarEntry, saveCalendarSetting, selectOrAddCalendarPerson, calendarPersonDeletionPreview, deleteCalendarPerson } from "../../lib/calendar-store";
import { revalidatePath } from "next/cache";
import { changeCalendarBlackout, type BlackoutChange } from "../../lib/calendar-blackout-store";
import { BlackoutError } from "../../lib/calendar-blackout-model";
export async function saveBlackout(input: BlackoutChange) {
  const actor = await requireAdmin();
  try {
    await changeCalendarBlackout(getDatabase(), actor.id, input);
    revalidatePath("/employee-calendar");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: error instanceof BlackoutError ? error.message : "Could not save this blackout. Your input is preserved; retry later." };
  }
}
export async function previewPersonDeletion(id: string) {
  const actor = await requireAdmin();
  try { return { ok: true as const, preview: await calendarPersonDeletionPreview(getDatabase(), actor.id, id) }; }
  catch { return { ok: false as const, message: "Could not check this person’s events. Refresh and try again." }; }
}
export async function removePerson(input: Parameters<typeof deleteCalendarPerson>[2]) {
  const actor = await requireAdmin();
  try { await deleteCalendarPerson(getDatabase(), actor.id, input); revalidatePath("/calendar"); revalidatePath("/employee-calendar"); return { ok: true as const }; }
  catch (error) { return { ok: false as const, message: error instanceof Error && /^This (person|event)/.test(error.message) ? error.message : "Could not confirm deletion. Review the current person and try again." }; }
}
export async function addPerson(input: { id: string; name: string }) {
  const actor = await requireAdmin();
  try {
    const person = await selectOrAddCalendarPerson(getDatabase(), actor.id, input);
    revalidatePath("/calendar"); revalidatePath("/employee-calendar");
    return { ok: true as const, person };
  } catch (error) { return { ok: false as const, message: error instanceof Error && /^(Enter|This person)/.test(error.message) ? error.message : "Could not add this person. Your event input is preserved; retry later." }; }
}
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
