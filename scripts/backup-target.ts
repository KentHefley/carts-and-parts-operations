import assert from "node:assert/strict";
import { developmentCredentials } from "./development-target";
import { pilotCredentials } from "./pilot-target";
import { productionCredentials } from "./production-target";
import { runtimeEnvironment } from "../lib/environment-policy";

export function backupCredentials(): { mode: "development" | "pilot" | "production"; databaseUrl: string } {
  const mode = process.env.BACKUP_ENV ?? "development";
  assert.ok(mode === "development" || mode === "pilot" || mode === "production", "Unsupported backup environment.");
  if (mode === "development") {
    const { databaseUrl } = developmentCredentials();
    assert.equal(runtimeEnvironment().mode, mode);
    return { mode, databaseUrl };
  }
  if (process.env.CI !== "true") Object.assign(process.env, mode === "production" ? productionCredentials() : pilotCredentials());
  assert.equal(runtimeEnvironment().mode, mode);
  assert.ok(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  return { mode, databaseUrl: process.env.DATABASE_URL! };
}
