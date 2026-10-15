import { test } from "node:test";
import assert from "node:assert/strict";
import { compareUserNames } from "../lib/user-display-sort";
test("user display sorting uses surname word, full name tie-breaks and email fallback", () => {
  const rows = [
    { id: "1", displayName: "Amy Zebra", email: "first@example.invalid" },
    { id: "2", displayName: "Zoe  Adams ", email: "zoe@example.invalid" },
    { id: "3", displayName: "Ben Adams", email: "ben@example.invalid" },
    { id: "4", displayName: null, email: "middle@example.invalid" },
    { id: "5", displayName: "  ", email: "last@example.invalid" },
    { id: "6", displayName: "Cher", email: "cher@example.invalid" },
  ];
  assert.deepEqual([...rows].sort(compareUserNames).map(row => row.id), ["3", "2", "6", "5", "4", "1"]);
  assert.equal(rows[0].id, "1");
});
