import assert from "node:assert/strict";
import test from "node:test";
import { dateValue, displayDateValue, parseDateValue } from "../lib/date-values";

test("date-only values survive leap days and daylight-saving boundaries without shifting", () => {
  for (const value of ["2024-02-29", "2026-03-08", "2026-11-01", "2026-10-08"]) {
    assert.equal(dateValue(parseDateValue(value)!), value);
  }
  assert.equal(displayDateValue("2026-10-08"), "10/08/2026");
});
test("blanks and impossible dates do not become a different date", () => {
  for (const value of ["", "2026-02-29", "2026-02-30", "2026-13-01", "invalid"]) assert.equal(parseDateValue(value), undefined);
  assert.equal(displayDateValue(""), "Choose a date");
});
