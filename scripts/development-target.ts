import { config } from "dotenv";

export function developmentCredentials() {
  config({ path: ".env.local", quiet: true });
  const databaseUrl = process.env.DATABASE_URL;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!databaseUrl || !secretKey?.startsWith("sk_test_") || !publishableKey?.startsWith("pk_test_")) {
    throw new Error("Development credentials are required; no changes made.");
  }
  const target = new URL(databaseUrl);
  // Verified against Kent's Development project connection screenshot.
  if (target.hostname !== "ep-bold-sky-b5e3vwct-pooler.c-7.us-east-2.aws.neon.tech" || target.pathname !== "/neondb") {
    throw new Error("Database target differs from the verified development database.");
  }
  return { databaseUrl, secretKey };
}
