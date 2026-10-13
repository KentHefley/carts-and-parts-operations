import { test } from "node:test";
import assert from "node:assert/strict";
import { expandEntries, validateDetails, textColor, type Entry, type EventDetails } from "../lib/calendar-model";
const details: EventDetails = { title: "Synthetic event", people: [], primaryPerson: "", location: "", allDay: true, start: "2024-02-29", end: "2024-02-29", zone: "America/Chicago", repeat: "YEARLY", until: "", notes: "", category: "" };
const entry = (payload: EventDetails): Entry => ({ id: "fixture", kind: "management", revision: 0, payload, exceptions: {} });
test("yearly leap dates skip non-leap years and all-day end is exclusive", () => {
 assert.equal(expandEntries([entry(details)], [], [], "2025-02-01", "2025-03-01").length, 0);
 const events = expandEntries([entry(details)], [], [], "2028-02-01", "2028-03-01"); assert.equal(events[0].start, "2028-02-29"); assert.equal(events[0].end, "2028-03-01");
});
test("monthly day 31 skips short months; inclusive until", () => {
 const d = { ...details, start: "2026-01-31", end: "2026-01-31", repeat: "MONTHLY" as const, until: "2026-03-31" };
 assert.equal(expandEntries([entry(d)], [], [], "2026-02-01", "2026-03-01").length, 0);
 assert.equal(expandEntries([entry(d)], [], [], "2026-03-01", "2026-04-01")[0].start, "2026-03-31");
 assert.equal(expandEntries([entry(d)], [], [], "2026-04-01", "2026-05-01").length, 0);
});
test("timed repeats retain local clock time across DST, reject ambiguous/gap inputs", () => {
 const d = { ...details, allDay: false, start: "2026-03-07T09:00", end: "2026-03-07T10:00", repeat: "DAILY" as const, until: "2026-03-09" };
 const events = expandEntries([entry(d)], [], [], "2026-03-07", "2026-03-10"); assert.match(events[0].start, /09:00:00\.000-06:00$/); assert.match(events[1].start, /09:00:00\.000-05:00$/);
 assert.throws(() => validateDetails({ ...d, start: "2026-03-08T02:30", end: "2026-03-08T03:30" }));
 assert.throws(() => validateDetails({ ...d, start: "2026-11-01T01:30", end: "2026-11-01T03:30", until: "" }));
});
test("single exceptions override/delete occurrences, including moved dates", () => {
 const d = { ...details, start: "2026-10-01", end: "2026-10-01", repeat: "DAILY" as const, until: "2026-10-03" };
 const e = entry(d); e.exceptions = { "2026-10-01": null, "2026-10-02": { ...d, repeat: "NONE", start: "2026-11-01", end: "2026-11-01" } };
 assert.equal(expandEntries([e], [], [], "2026-10-01", "2026-10-05").length, 1);
 assert.equal(expandEntries([e], [], [], "2026-11-01", "2026-11-02")[0].key, "2026-10-02");
});
test("validation and contrast guard invalid ranges and identifiers", () => {
 assert.throws(() => validateDetails({ ...details, people: ["bad"] })); assert.throws(() => validateDetails({ ...details, title: " " }));
 assert.equal(textColor("#FFFFFF"), "#000000"); assert.equal(textColor("#000000"), "#FFFFFF");
 assert.throws(() => expandEntries([], [], [], "2026-01-01", "2027-01-01"));
});
