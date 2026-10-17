import assert from "node:assert/strict";
import { test } from "node:test";
import { hoursWorked } from "../lib/hours-worked";

test("Hours Worked requires two valid times and preserves missing values", () => {
  for (const [start, end] of [["", ""], ["08:00", ""], ["", "17:00"], ["25:00", "10:00"], ["08:00", "09:60"]]) assert.equal(hoursWorked(start, end), "");
});
test("Hours Worked preserves exact same-day and overnight hours and minutes", () => {
  assert.equal(hoursWorked("07:20", "15:30"), "8h 10m");
  assert.equal(hoursWorked("21:30", "03:24"), "5h 54m");
  assert.equal(hoursWorked("08:00", "16:30"), "8h 30m");
  assert.equal(hoursWorked("22:00", "06:30"), "8h 30m");
  assert.equal(hoursWorked("23:59", "00:00"), "0h 1m");
  assert.equal(hoursWorked("09:00", "09:01"), "0h 1m");
  assert.equal(hoursWorked("09:00", "09:02"), "0h 2m");
  assert.equal(hoursWorked("00:01", "00:00"), "23h 59m");
});
test("Equal Time In/Out means zero hours", () => {
  assert.equal(hoursWorked("09:00", "09:00"), "0h 0m");
  assert.equal(hoursWorked("00:00", "00:00"), "0h 0m");
});
