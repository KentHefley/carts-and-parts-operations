import { readFileSync } from "node:fs";
import { parse } from "dotenv";

// Enrolled from Kent's separately created Neon pilot project and verified empty database.
export const pilotDatabaseHost = "ep-summer-frog-b5cbla8f-pooler.c-7.us-east-2.aws.neon.tech";
export const pilotBucket = "carts-parts-operations-pilot";

export function validatePilotTarget(env: Record<string, string>, development: Record<string, string>) {
  const target = new URL(env.DATABASE_URL ?? "https://invalid");
  if (target.protocol !== "postgresql:" || target.hostname !== pilotDatabaseHost || target.pathname !== "/neondb"
    || env.R2_BUCKET_NAME !== pilotBucket || !env.CLERK_SECRET_KEY?.startsWith("sk_test_")
    || !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")
    || !/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID ?? "") || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY
    || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === development.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || env.CLERK_SECRET_KEY === development.CLERK_SECRET_KEY || env.R2_ACCESS_KEY_ID === development.R2_ACCESS_KEY_ID
    || env.R2_SECRET_ACCESS_KEY === development.R2_SECRET_ACCESS_KEY) {
    throw new Error("Pilot target validation failed; no changes allowed.");
  }
}

export function pilotCredentials() {
  const env = parse(readFileSync(".env.pilot.local"));
  const development = parse(readFileSync(".env.local"));
  validatePilotTarget(env, development);
  return env;
}
