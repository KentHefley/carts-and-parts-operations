export type ApplicationMode = "development" | "pilot" | "production";
type Environment = Record<string, string | undefined>;
export const pilotRecipients = ["kent@cartsandparts.com", "daryl@cartsandparts.com", "jake@cartsandparts.com", "suziah@cartsandparts.com"];
const targets = {
  development: { host: "ep-bold-sky-b5e3vwct-pooler.c-7.us-east-2.aws.neon.tech", bucket: "carts-parts-operations-development" },
  pilot: { host: "ep-summer-frog-b5cbla8f-pooler.c-7.us-east-2.aws.neon.tech", bucket: "carts-parts-operations-pilot" },
  production: { host: "ep-flat-boat-behrz8oq-pooler.c-9.us-east-2.aws.neon.tech", bucket: "carts-parts-operations-production" },
};

export function applicationMode(env: Environment = process.env): ApplicationMode {
  const mode = env.APP_ENV || "development";
  if (mode !== "development" && mode !== "pilot" && mode !== "production") throw new Error("Application environment is not enabled.");
  if (env.VERCEL && !env.APP_ENV) throw new Error("Hosted application requires an explicit environment.");
  return mode;
}

export function runtimeEnvironment(env: Environment = process.env) {
  const mode = applicationMode(env);
  const target = targets[mode];
  let database: URL;
  try { database = new URL(env.DATABASE_URL ?? "https://invalid"); }
  catch { throw new Error("Database target configuration is invalid."); }
  if (database.protocol !== "postgresql:" || database.hostname !== target.host || database.pathname !== "/neondb"
    || !database.username || !database.password || env.R2_BUCKET_NAME !== target.bucket
    || !env.CLERK_SECRET_KEY?.startsWith(mode === "production" ? "sk_live_" : "sk_test_")
    || !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith(mode === "production" ? "pk_live_" : "pk_test_")) {
    throw new Error("Application services do not match the selected environment.");
  }
  if (mode === "pilot") {
    const domain = Buffer.from(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.slice(8), "base64").toString().replace(/\$$/, "");
    if (env.NEXT_PUBLIC_APP_ENV !== "pilot" || domain !== "adapted-koi-370.clerk.accounts.dev") throw new Error("Pilot login or visible environment configuration does not match.");
    if (env.VERCEL && env.VERCEL_PROJECT_ID !== "prj_JNid49dzev0RZ6FSKlHrPZxrAeOj") throw new Error("Pilot deployment project does not match.");
  } else if (mode === "production") {
    const domain = Buffer.from(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.slice(8), "base64").toString().replace(/\$$/, "");
    if (env.NEXT_PUBLIC_APP_ENV !== "production" || domain !== "clerk.cartsandparts.com"
      || env.APP_URL !== "https://operations.cartsandparts.com") throw new Error("Production login or app origin does not match.");
    if (env.VERCEL && (env.VERCEL_ENV !== "production" || env.VERCEL_PROJECT_ID !== "prj_bIdQIZ4SSKkgAQOxHQzqZHjA848W")) {
      throw new Error("Production services require the production project and deployment target.");
    }
  } else if (env.NEXT_PUBLIC_APP_ENV && env.NEXT_PUBLIC_APP_ENV !== "development") {
    throw new Error("Visible environment does not match development.");
  }
  return { mode, bucket: target.bucket, namespace: mode };
}

export function pilotAllowlist(value: string | undefined) {
  const entries = (value || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (entries.some((email) => !pilotRecipients.includes(email))) throw new Error("Pilot recipient configuration includes an unapproved address.");
  return [...new Set(entries)];
}
