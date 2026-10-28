import { DateTime } from "luxon";

export const blackoutKind = "vacation-blackout";
export type BlackoutDetails = { start: string; end: string; reason: string };
export type CalendarBlackout = BlackoutDetails & { id: string; revision: number };
export class BlackoutError extends Error {}
const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value, { zone: "UTC" }).isValid;
export function validateBlackout(value: unknown): BlackoutDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BlackoutError("Enter blackout dates and a reason.");
  const { start, end, reason } = value as Record<string, unknown>;
  if (!validDate(start) || !validDate(end) || start > end) throw new BlackoutError("Choose valid dates with the start on or before the end. Both dates are included.");
  if (typeof reason !== "string" || !reason.trim() || reason.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(reason)) throw new BlackoutError("Enter a reason of 1–500 characters.");
  return { start, end, reason: reason.trim() };
}
// Date strings are calendar dates, never instants converted through a viewer's zone.
export const blackoutsOnDate = (rows: CalendarBlackout[], date: string) => rows.filter(row => row.start <= date && row.end >= date);
export const blackoutsInRange = (rows: CalendarBlackout[], from: string, exclusiveTo: string) => rows.filter(row => row.start < exclusiveTo && row.end >= from);
export const blackoutDateLabel = (date: string) => DateTime.fromISO(date, { zone: "UTC" }).toFormat("MMM d, yyyy");
