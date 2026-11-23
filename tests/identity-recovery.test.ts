import assert from "node:assert/strict";
import test from "node:test";
import { recoverIdentity } from "../lib/identity-recovery";

test("successful and signed-out identity reads never trigger a retry", async () => {
  const fresh = async () => { throw Error("Unexpected retry"); };
  assert.equal(await recoverIdentity(async () => "identity", fresh), "identity");
  assert.equal(await recoverIdentity(async () => null, fresh), null);
});

test("transient Clerk failure uses one fresh identity lookup", async () => {
  let attempts = 0;
  const user = { id: "user_fixture", banned: true };
  const result = await recoverIdentity(async () => { throw { clerkError: true, status: 502 }; }, async () => { attempts++; return user; });
  assert.equal(result, user);
  assert.equal(attempts, 1);
});

test("persistent identity failure propagates after the single retry", async () => {
  let attempts = 0;
  const error = Error("Still unavailable");
  await assert.rejects(recoverIdentity(async () => { throw { clerkError: true, status: 503 }; }, async () => { attempts++; throw error; }), error);
  assert.equal(attempts, 1);
});

test("authorization, rate limit, redirect and unrelated failures are never retried", async () => {
  for (const error of [{ clerkError: true, status: 401 }, { clerkError: true, status: 403 }, { clerkError: true, status: 404 },
    { clerkError: true, status: 429 }, { status: 502 }, Error("NEXT_REDIRECT")]) {
    await assert.rejects(recoverIdentity(async () => { throw error; }, async () => { throw Error("Unexpected retry"); }), value => value === error);
  }
});
