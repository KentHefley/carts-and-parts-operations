import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUnitPrice, itemNumberErrors } from "../lib/item-price";

test("formatted USD prices normalize exactly without floating point", () => {
  for (const [raw, expected] of [["126", "126"], ["126.00", "126"], ["$126.00", "126"], ["$1,260.00", "1260"], [" 1,260.50 ", "1260.5"], ["-$1,260.01", "-1260.01"], ["$0.10", "0.1"], ["000.00", "0"], [" ", ""], ["99999999999999.99", "99999999999999.99"]]) assert.equal(normalizeUnitPrice(raw), expected);
});
test("ambiguous or invalid prices are rejected, not rounded or guessed", () => {
  for (const raw of ["1,26.00", "126,00", "126.001", "$1.260,00", "quoted", "1e2", "NaN", "Infinity", "$", "100000000000000", "1 260.00"]) assert.equal(normalizeUnitPrice(raw), null, raw);
  assert.deepEqual(itemNumberErrors([{ quantity: "bad", unitPrice: "$126.00" }, { quantity: "2", unitPrice: "$1,26.00" }]).map(error => [error.index, error.field]), [[0, "quantity"], [1, "unitPrice"]]);
});
