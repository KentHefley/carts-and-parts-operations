import { DateTime } from "luxon";
import { RRule } from "rrule";
export type CalendarKind = "management" | "employee";
export type Person = { id: string; name: string; color: string; active: boolean; revision: number; userId?: string | null };
export type Category = { id: string; name: string; color: string; active: boolean; revision: number };
export type EventDetails = { title: string; people: string[]; primaryPerson: string; location: string; allDay: boolean; start: string; end: string; zone: string; repeat: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"; until: string; notes: string; category: string };
export type Entry = { id: string; kind: string; revision: number; payload: EventDetails; exceptions: Record<string, EventDetails | null> };
export type Occurrence = { id: string; entryId: string; key: string; revision: number; title: string; start: string; end: string; allDay: boolean; backgroundColor: string; borderColor: string; textColor: string; details: EventDetails };
export const defaultCategories = [{ name: "Time Off", color: "#097C78" }, { name: "Birthday", color: "#8345B9" }, { name: "Work Anniversary", color: "#AB4B10" }, { name: "Holiday", color: "#2457AA" }];
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const colorValid = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
export function textColor(color: string) {
  const rgb = [1, 3, 5].map(offset => { const n = parseInt(color.slice(offset, offset + 2), 16) / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; });
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > .179 ? "#000000" : "#FFFFFF";
}
function local(value: string, allDay: boolean, zone: string) { return DateTime.fromISO(value, { zone: allDay ? "UTC" : zone }); }
export function validateDetails(value: unknown): EventDetails {
  if (!value || typeof value !== "object" || JSON.stringify(value).length > 14000) throw new Error("Invalid event.");
  const v = value as EventDetails;
  for (const [key, max] of [["title", 200], ["location", 200], ["notes", 5000], ["zone", 80], ["start", 16], ["end", 16], ["until", 10], ["category", 36], ["primaryPerson", 36]] as const) if (typeof v[key] !== "string" || v[key].length > max) throw new Error("Check event fields and text lengths.");
  if (!v.title.trim() || typeof v.allDay !== "boolean" || !Array.isArray(v.people) || v.people.length > 100 || !v.people.every(uuid) || new Set(v.people).size !== v.people.length || (v.primaryPerson && !v.people.includes(v.primaryPerson)) || (v.people.length > 0 && !v.primaryPerson)) throw new Error("Enter a title and choose a primary person from the selected people.");
  if (!["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(v.repeat)) throw new Error("Invalid repeat pattern.");
  if (!DateTime.now().setZone(v.zone).isValid) throw new Error("Choose a valid time zone.");
  const format = v.allDay ? /^\d{4}-\d\d-\d\d$/ : /^\d{4}-\d\d-\d\dT\d\d:\d\d$/;
  const start = local(v.start, v.allDay, v.zone), end = local(v.end, v.allDay, v.zone);
  if (!format.test(v.start) || !format.test(v.end) || !start.isValid || !end.isValid || start.toFormat(v.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm") !== v.start || end.toFormat(v.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm") !== v.end || end < start || (!v.allDay && +end === +start) || end.diff(start, "days").days > 366) throw new Error("Enter a valid start/end range (up to 366 days). Daylight-saving gaps are not valid times.");
  if (!v.allDay && (start.getPossibleOffsets().length > 1 || end.getPossibleOffsets().length > 1)) throw new Error("That clock time occurs twice during daylight saving. Choose an unambiguous time.");
  if (v.until && (!/^\d{4}-\d\d-\d\d$/.test(v.until) || !DateTime.fromISO(v.until).isValid || v.until < v.start.slice(0, 10))) throw new Error("Repeat end date must be on or after the start date.");
  return { title: v.title.trim(), people: [...v.people], primaryPerson: v.primaryPerson, location: v.location, allDay: v.allDay, start: v.start, end: v.end, zone: v.zone, repeat: v.repeat, until: v.until, notes: v.notes, category: v.category };
}
function floating(value: string) { return new Date(`${value.length === 10 ? `${value}T00:00` : value}:00Z`); }
function instant(value: string, allDay: boolean, zone: string) {
  const parsed = local(value, allDay, zone);
  if (!parsed.isValid || parsed.toFormat(allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm") !== value) return null;
  return allDay ? value : parsed.getPossibleOffsets().sort((a, b) => +a - +b)[0].toISO()!;
}
export function expandEntries(entries: Entry[], people: Person[], categories: Category[], from: string, to: string): Occurrence[] {
  const lower = DateTime.fromISO(from), upper = DateTime.fromISO(to);
  if (!lower.isValid || !upper.isValid || upper <= lower || upper.diff(lower, "days").days > 70) throw new Error("Choose a calendar range up to 70 days.");
  const output: Occurrence[] = [];
  for (const entry of entries) {
    const p = entry.payload;
    const length = +floating(p.end) - +floating(p.start) + (p.allDay ? 86400_000 : 0);
    const starts = p.repeat === "NONE" ? [floating(p.start)] : new RRule({ freq: RRule[p.repeat], dtstart: floating(p.start), ...(p.until ? { until: new Date(`${p.until}T23:59:59Z`) } : {}) }).between(new Date(+lower - length - 2 * 86400_000), new Date(+upper + 2 * 86400_000), true);
    const candidates = new Map<string, EventDetails | null>();
    for (const start of starts) { const key = start.toISOString().slice(0, p.allDay ? 10 : 16); candidates.set(key, key in entry.exceptions ? entry.exceptions[key] : { ...p, start: key, end: new Date(+start + length - (p.allDay ? 86400_000 : 0)).toISOString().slice(0, p.allDay ? 10 : 16) }); }
    for (const [key, override] of Object.entries(entry.exceptions)) candidates.set(key, override);
    for (const [key, details] of candidates) {
      if (!details) continue;
      const start = instant(details.start, details.allDay, details.zone);
      const endLocal = details.allDay ? DateTime.fromISO(details.end, { zone: "UTC" }).plus({ days: 1 }).toISODate()! : details.end;
      const end = instant(endLocal, details.allDay, details.zone);
      if (!start || !end || +DateTime.fromISO(end) <= +lower || +DateTime.fromISO(start) >= +upper) continue;
      const color = (entry.kind === "management" ? people.find(person => person.id === details.primaryPerson)?.color : categories.find(category => category.id === details.category)?.color) ?? "#596575";
      output.push({ id: `${entry.id}/${key}`, entryId: entry.id, key, revision: entry.revision, title: details.title, start, end, allDay: details.allDay, backgroundColor: color, borderColor: color, textColor: textColor(color), details });
      if (output.length > 5000) throw new Error("Too many calendar events. Use a shorter date range.");
    }
  }
  return output;
}
