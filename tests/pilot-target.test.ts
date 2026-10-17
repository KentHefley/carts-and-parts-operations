import assert from "node:assert/strict";
import test from "node:test";
import { pilotDatabaseHost, validatePilotTarget } from "../scripts/pilot-target";

const pilot = { DATABASE_URL: `postgresql://fixture:fixture@${pilotDatabaseHost}/neondb`, R2_BUCKET_NAME: "carts-parts-operations-pilot", R2_ACCOUNT_ID: "a".repeat(32), R2_ACCESS_KEY_ID: "pilot-fixture-key", R2_SECRET_ACCESS_KEY: "pilot-fixture-secret", CLERK_SECRET_KEY: "sk_test_pilot_fixture", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_pilot_fixture" };
const development = { R2_ACCESS_KEY_ID: "dev-fixture-key", R2_SECRET_ACCESS_KEY: "dev-fixture-secret", CLERK_SECRET_KEY: "sk_test_dev_fixture", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_dev_fixture" };

test("pilot target accepts only its enrolled database and separate test services", () => {
  assert.doesNotThrow(() => validatePilotTarget(pilot, development));
  for (const DATABASE_URL of [pilot.DATABASE_URL.replace("postgresql:", "ostgresql:"), pilot.DATABASE_URL.replace(pilotDatabaseHost, "ep-bold-sky-b5e3vwct-pooler.c-7.us-east-2.aws.neon.tech"), pilot.DATABASE_URL.replace("/neondb", "/other")]) {
    assert.throws(() => validatePilotTarget({ ...pilot, DATABASE_URL }, development));
  }
});

test("mixed development keys, live Clerk keys and missing storage credentials are rejected", () => {
  for (const name of ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"] as const) {
    assert.throws(() => validatePilotTarget({ ...pilot, [name]: development[name] }, development));
    assert.throws(() => validatePilotTarget({ ...pilot, [name]: "" }, development));
  }
  assert.throws(() => validatePilotTarget({ ...pilot, CLERK_SECRET_KEY: "sk_live_fixture" }, development));
  assert.throws(() => validatePilotTarget({ ...pilot, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_fixture" }, development));
  assert.throws(() => validatePilotTarget({ ...pilot, R2_BUCKET_NAME: "carts-parts-operations-development" }, development));
  assert.throws(() => validatePilotTarget({ ...pilot, R2_ACCOUNT_ID: "invalid" }, development));
});
