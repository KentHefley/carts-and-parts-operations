import assert from "node:assert/strict";
import test from "node:test";
import { groupActivity } from "../lib/activity-grouping";

const event = (id: string, seconds: number, changes: Record<string, unknown>, actorId = "kent", orderId = "order-a") => ({ id, actorId, orderId, createdAt: new Date(2026, 9, 8, 10, 0, seconds), changes });
test("quick corrections show initial and final values without changing audit records", () => {
  const rows = [event("new", 6, { contact: { before: "Joan Mithcell", after: "Joan Mitchell" } }), event("old", 2, { contact: { before: "", after: "Joan Mithcell" } })];
  const snapshot = structuredClone(rows);
  const grouped = groupActivity(rows);
  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0].changes, { contact: { before: "", after: "Joan Mitchell" } });
  assert.equal(grouped[0].lastEventId, "old");
  assert.deepEqual(rows, snapshot);
});
test("keep distinct actors, orders, status, assignment and older edit sessions separate", () => {
  for (const older of [event("b", 0, { text: { before: "", after: "x" } }, "other"), event("b", 0, { text: { before: "", after: "x" } }, "kent", "other"), event("b", 0, { status: { before: "Pending", after: "Complete" } }), event("b", 0, { assignments: { before: [], after: ["kent"] } }), event("b", -61, { text: { before: "", after: "x" } })]) {
    assert.equal(groupActivity([event("a", 0, { text: { before: "x", after: "y" } }), older]).length, 2);
  }
});
