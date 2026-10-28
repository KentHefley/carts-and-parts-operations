"use server";
import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { savedNameSuggestions } from "../../lib/saved-name-store";
import { personalDescriptionField } from "../../lib/saved-name-model";
import { personalDescriptionSuggestions } from "../../lib/personal-description-store";

export async function findSavedNames(field: string, query: string) {
  const actor = await requireApprovedUser();
  try { return { names: await (personalDescriptionField(field) ? personalDescriptionSuggestions : savedNameSuggestions)(getDatabase(), actor.id, field, query), error: "" }; }
  catch { return { names: [], error: "Suggestions unavailable. You can still type a name." }; }
}
