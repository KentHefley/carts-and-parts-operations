import { test } from "node:test";
import assert from "node:assert/strict";
import { approvedAccess } from "../lib/access-policy";

const account = { clerkUserId: "approved-id", email: "employee@example.com", active: true, role: "USER" as const };
const identity = { id: "approved-id", primaryEmail: "Employee@example.com", emailVerified: true, banned: false, locked: false };

test("approved verified account grants access", () => assert.equal(approvedAccess(account, identity), true));
test("unknown and inactive accounts are denied", () => {
  assert.equal(approvedAccess(null, identity), false);
  assert.equal(approvedAccess({ ...account, active: false }, identity), false);
});
test("identity/email mismatch, unverified, banned and locked accounts are denied", () => {
  for (const change of [{ id: "another-id" }, { primaryEmail: "other@example.com" }, { primaryEmail: null }, { emailVerified: false }, { banned: true }, { locked: true }]) {
    assert.equal(approvedAccess(account, { ...identity, ...change }), false);
  }
});
