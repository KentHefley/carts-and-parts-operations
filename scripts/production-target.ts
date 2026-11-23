import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { runtimeEnvironment } from "../lib/environment-policy";

export function productionCredentials() {
  const env = parse(readFileSync(".env.production.local"));
  if (env.APP_ENV !== "production") throw new Error("Production configuration required.");
  runtimeEnvironment(env);
  for (const file of [".env.local", ".env.pilot.local"]) {
    const other = parse(readFileSync(file));
    for (const name of ["DATABASE_URL", "CLERK_SECRET_KEY", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]) {
      if (!env[name] || env[name] === other[name]) throw new Error("Separate production credentials required.");
    }
  }
  return env;
}
