import assert from "node:assert/strict";
import test from "node:test";
import { applicationMode, runtimeEnvironment, pilotAllowlist } from "../lib/environment-policy";
import { verifyEmailRecipients } from "../lib/email-config";
import { invitationConfiguration } from "../lib/invitation-policy";

const pilot = {
  APP_ENV: "pilot", NEXT_PUBLIC_APP_ENV: "pilot",
  DATABASE_URL: "postgresql://fixture:fixture@ep-summer-frog-b5cbla8f-pooler.c-7.us-east-2.aws.neon.tech/neondb",
  R2_BUCKET_NAME: "carts-parts-operations-pilot", CLERK_SECRET_KEY: "sk_test_fixture",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("adapted-koi-370.clerk.accounts.dev$").toString("base64")}`,
};

test("pilot service targets and hosted project must match explicitly", () => {
  assert.equal(applicationMode({}), "development");
  assert.equal(runtimeEnvironment(pilot).namespace, "pilot");
  assert.throws(() => applicationMode({ VERCEL: "1" }));
  assert.throws(() => applicationMode({ APP_ENV: "live" }));
  for (const override of [
    { DATABASE_URL: pilot.DATABASE_URL.replace("summer-frog", "wrong") },
    { R2_BUCKET_NAME: "carts-parts-operations-development" },
    { CLERK_SECRET_KEY: "sk_live_fixture" },
    { NEXT_PUBLIC_APP_ENV: "development" },
    { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_wrong" },
    { VERCEL: "1", VERCEL_PROJECT_ID: "wrong" },
  ]) assert.throws(() => runtimeEnvironment({ ...pilot, ...override }));
});

test("pilot email and invitations fail closed outside the approved list", () => {
  const env = { ...pilot, SO_EMAIL_ALLOWED_RECIPIENTS: "kent@cartsandparts.com,daryl@cartsandparts.com,jake@cartsandparts.com" };
  assert.doesNotThrow(() => verifyEmailRecipients(["DARYL@cartsandparts.com", "jake@cartsandparts.com"], env));
  assert.throws(() => verifyEmailRecipients(["kent@cartsandparts.com", "other@example.com"], env));
  assert.throws(() => verifyEmailRecipients(["kent@cartsandparts.com"], pilot));
  assert.throws(() => pilotAllowlist("other@example.com"));
  assert.deepEqual(pilotAllowlist(" Kent@cartsandparts.com,kent@cartsandparts.com "), ["kent@cartsandparts.com"]);
  assert.throws(() => invitationConfiguration(pilot));
  assert.throws(() => invitationConfiguration({ ...pilot, APP_URL: "https://fixture.example", INVITATION_ALLOWED_RECIPIENTS: "other@example.com" }));
  assert.deepEqual(invitationConfiguration({ ...pilot, APP_URL: "https://fixture.example", INVITATION_ALLOWED_RECIPIENTS: "jake@cartsandparts.com" }).allowed, ["jake@cartsandparts.com"]);
});
