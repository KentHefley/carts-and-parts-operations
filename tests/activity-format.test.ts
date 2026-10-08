import assert from "node:assert/strict";
import test from "node:test";
import { activityValue, itemHistoryRows } from "../lib/activity-format";

test("historical item edits show only changed values with employee-facing labels", () => {
  const blank = { quantity: "", unitPrice: "", description: "" };
  const rows = itemHistoryRows([blank, blank, blank], [{ quantity: "2.5", unitPrice: "12.34", description: "CW2 test refill kit" }, blank, blank]);
  assert.deepEqual(rows, [
    { item: 1, field: "Description", before: "", after: "CW2 test refill kit" },
    { item: 1, field: "Quantity", before: "", after: "2.5" },
    { item: 1, field: "Unit Price", before: "", after: "12.34" },
  ]);
  assert.equal(activityValue(rows[0].before, new Map()), "—");
});

test("added blank rows and removed rows remain visible in history", () => {
  const blank = { description: "", quantity: "", unitPrice: "" };
  assert.deepEqual(itemHistoryRows([], [blank]), [{ item: 1, field: "Item row", before: "—", after: "Added" }]);
  assert.deepEqual(itemHistoryRows([blank], []), [{ item: 1, field: "Item row", before: "Present", after: "Removed" }]);
});

test("assignment names and structured fallback values avoid raw JSON", () => {
  assert.equal(activityValue(["employee-id"], new Map([["employee-id", "Kent Hefley"]])), "Kent Hefley");
  assert.equal(activityValue({ unitPrice: "12.34", description: "CW2" }, new Map()), "unit Price: 12.34; description: CW2");
});
