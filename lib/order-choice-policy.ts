export const choiceFields = [
  { key: "terms__1", label: "Terms" },
  { key: "freight__1", label: "Freight-Shipping" },
  { key: "dropdown__1", label: "Job Type" },
  { key: "division__1", label: "Division" },
] as const;
export type ChoiceRow = { id: string; fieldKey: string; label: string; active: boolean; version: number };
export type ChoiceOptions = Record<string, string[]>;
export const managedChoice = (key: string) => choiceFields.some(field => field.key === key);
export const normalizeChoice = (label: string) => label.trim().replace(/\s+/g, " ").toLowerCase();
export function choiceOptions(rows: ChoiceRow[]): ChoiceOptions {
  return Object.fromEntries(choiceFields.map(field => [field.key, rows.filter(row => row.fieldKey === field.key && row.active).map(row => row.label)]));
}
export function retainedChoice(options: string[], current: string) {
  return Boolean(current && !options.includes(current));
}
