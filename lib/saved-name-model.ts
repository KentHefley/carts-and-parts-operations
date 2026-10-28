// Match punctuation variants without changing the saved name or guessing spelling.
export const normalizeSavedName = (value: string) => value.replace(/['‘’ʼ＇]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
export type SavedNameField = "text_13__1" | "text_21__1";
export type PersonalDescriptionField = "itemDescription" | "text_32__1";
export type SuggestionField = SavedNameField | PersonalDescriptionField;
export function personalDescriptionField(value: unknown): value is PersonalDescriptionField {
  return value === "itemDescription" || value === "text_32__1";
}
export function savedNameField(value: unknown): value is SavedNameField {
  return value === "text_13__1" || value === "text_21__1";
}
