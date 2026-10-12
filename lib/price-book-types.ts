export const bookKeys = ["Yellow", "Blue", "White"] as const;
export type BookKey = typeof bookKeys[number];
export const isBookKey = (value: string): value is BookKey => bookKeys.includes(value as BookKey);
export const priceBookLimit = 20_000_000;
export function validEdition(value: string) { return value === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
export type BookView = { key: BookKey; revision: number; edition: string; file: { id: string; filename: string; pages: number; size: number; uploadedAt: string } | null };
export function editionLabel(value: string) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`)) : "Edition not set";
}
