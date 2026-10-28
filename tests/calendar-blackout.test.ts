import test from "node:test";
import assert from "node:assert/strict";
import { blackoutsInRange, blackoutsOnDate, blackoutDateLabel, validateBlackout } from "../lib/calendar-blackout-model";
const row = { id: "sample", revision: 0, start: "2026-11-23", end: "2026-11-29", reason: "Thanksgiving busy period" };
test("blackout dates are inclusive, validated calendar dates with a required reason", () => {
  assert.deepEqual(validateBlackout({ ...row, reason: "  Busy week  " }), { start: row.start, end: row.end, reason: "Busy week" });
  for (const value of [{ ...row, start: "2026-02-30" }, { ...row, end: "2026-11-22" }, { ...row, start: "2026-11-23T00:00:00Z" }, { ...row, reason: " " }, { ...row, reason: "a".repeat(501) }, null]) assert.throws(() => validateBlackout(value));
  assert.equal(blackoutsOnDate([row], "2026-11-22").length, 0);
  assert.equal(blackoutsOnDate([row], "2026-11-23").length, 1);
  assert.equal(blackoutsOnDate([row], "2026-11-29").length, 1);
  assert.equal(blackoutsOnDate([row], "2026-11-30").length, 0);
});
test("blackouts use visible-range overlap with an exclusive upper view boundary", () => {
  assert.equal(blackoutsInRange([row], "2026-11-16", "2026-11-23").length, 0);
  assert.equal(blackoutsInRange([row], "2026-11-29", "2026-12-06").length, 1);
  assert.equal(blackoutsInRange([row], "2026-11-30", "2026-12-07").length, 0);
  assert.equal(blackoutsInRange([row], "2026-11-01", "2026-12-01").length, 1);
  assert.equal(blackoutsOnDate([row, { ...row, id: "overlap" }], "2026-11-26").length, 2);
});
test("blackout dates remain date-only through daylight saving changes and year boundaries", () => {
  const dst = { ...row, start: "2026-10-31", end: "2026-11-02" };
  assert.equal(blackoutsOnDate([dst], "2026-11-01").length, 1);
  assert.equal(blackoutDateLabel("2026-11-01"), "Nov 1, 2026");
  assert.equal(blackoutsOnDate([{ ...row, start: "2026-12-31", end: "2027-01-02" }], "2027-01-01").length, 1);
});
