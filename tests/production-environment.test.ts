import assert from "node:assert/strict";
import test from "node:test";
import { runtimeEnvironment } from "../lib/environment-policy";
import { orderNumber } from "../lib/order-number";
import { verifyEmailRecipients } from "../lib/email-config";
import { invitationConfiguration } from "../lib/invitation-policy";

const production = {
  APP_ENV: "production", NEXT_PUBLIC_APP_ENV: "production",
  APP_URL: "https://operations.cartsandparts.com",
  DATABASE_URL: "postgresql://fixture:fixture@ep-flat-boat-behrz8oq-pooler.c-9.us-east-2.aws.neon.tech/neondb",
  R2_BUCKET_NAME: "carts-parts-operations-production",
  CLERK_SECRET_KEY: "sk_live_fixture",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_live_${Buffer.from("clerk.cartsandparts.com$").toString("base64")}`,
  VERCEL: "1", VERCEL_ENV: "production", VERCEL_PROJECT_ID: "prj_bIdQIZ4SSKkgAQOxHQzqZHjA848W",
};

test("production requires enrolled services and rejects preview deployments", () => {
  assert.equal(runtimeEnvironment(production).namespace, "production");
  for (const override of [
    { VERCEL_ENV: "preview" }, { VERCEL_PROJECT_ID: "prj_JNid49dzev0RZ6FSKlHrPZxrAeOj" },
    { APP_URL: "https://unexpected.example.com" }, { NEXT_PUBLIC_APP_ENV: "pilot" },
    { CLERK_SECRET_KEY: "sk_test_fixture" }, { R2_BUCKET_NAME: "carts-parts-operations-pilot" },
    { DATABASE_URL: production.DATABASE_URL.replace("flat-boat-behrz8oq", "summer-frog-b5cbla8f") },
    { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_live_${Buffer.from("wrong.example.com$").toString("base64")}` },
  ]) assert.throws(() => runtimeEnvironment({ ...production, ...override }));
});

test("production numbering and communication use production configuration", () => {
  assert.equal(orderNumber(25000, "production"), "25000");
  assert.equal(orderNumber(25001, "production"), "25001");
  assert.equal(orderNumber(10, "development"), "DEV-000010");
  assert.equal(orderNumber(10, "pilot"), "DEV-000010");
  assert.doesNotThrow(() => verifyEmailRecipients(["employee@example.com"], production));
  assert.throws(() => verifyEmailRecipients([], production));
  assert.throws(() => verifyEmailRecipients(["invalid"], production));
  assert.throws(() => verifyEmailRecipients(["employee@example.com"], { ...production, VERCEL_ENV: "preview" }));
  const invitation = invitationConfiguration(production);
  assert.equal(invitation.redirectUrl, "https://operations.cartsandparts.com/sign-up");
  assert.equal(invitation.allowed, null);
});
