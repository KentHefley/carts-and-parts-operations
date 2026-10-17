// Time-only elapsed hours; all-day and multi-day scheduling are separate fields.
export function hoursWorked(timeIn: string, timeOut: string): string {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!valid.test(timeIn) || !valid.test(timeOut)) return "";
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  const elapsed = (minutes(timeOut) - minutes(timeIn) + 1440) % 1440;
  return `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
}
