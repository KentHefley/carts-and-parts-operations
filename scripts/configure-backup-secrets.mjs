import assert from "node:assert/strict";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const repository = "KentHefley/carts-and-parts-operations";
const environment = "development-backups";
const endpoint = `repos/${repository}/environments/${environment}`;

async function gh(args, input, allowMissing = false) {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { error += chunk.toString(); });
    child.once("error", () => reject(new Error("GitHub CLI could not start.")));
    child.once("exit", (code) => {
      if (code === 0) resolve(output);
      else if (allowMissing && error.includes("HTTP 404")) resolve(undefined);
      else reject(new Error("GitHub backup configuration failed; credentials withheld. Retry after checking access."));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input ?? ""); // Values never enter command arguments or logs.
  });
}

async function main() {
  config({ path: ".env.local", quiet: true });
  config({ path: ".env.backup.local", quiet: true });
  const names = ["DATABASE_URL", "CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", "DROPBOX_REFRESH_TOKEN"];
  for (const name of names) assert.ok(process.env[name]?.trim(), `${name} is missing.`);
  const db = new URL(process.env.DATABASE_URL);
  assert.equal(db.hostname, "ep-bold-sky-b5e3vwct-pooler.c-7.us-east-2.aws.neon.tech");
  assert.equal(db.pathname, "/neondb");
  assert.ok(process.env.CLERK_SECRET_KEY.startsWith("sk_test_") && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_"));
  assert.equal(process.env.R2_BUCKET_NAME, "carts-parts-operations-development");
  const key = await readFile(".recovery/backup.key");
  assert.equal(key.length, 32, "Existing recovery key is invalid.");
  const existing = await gh(["api", endpoint], undefined, true);
  if (!existing) {
    await gh(["api", "--method", "PUT", endpoint, "--input", "-"], JSON.stringify({ deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } }));
    await gh(["api", "--method", "POST", `${endpoint}/deployment-branch-policies`, "--input", "-"], JSON.stringify({ name: "main", type: "branch" }));
  }
  const settings = JSON.parse(await gh(["api", endpoint]));
  assert.deepEqual(settings.deployment_branch_policy, { protected_branches: false, custom_branch_policies: true }, "Backup environment needs custom main-only branch restrictions.");
  const policies = JSON.parse(await gh(["api", `${endpoint}/deployment-branch-policies`]));
  assert.equal(policies.branch_policies.length, 1, "Unexpected backup environment branch policies; no secrets changed.");
  assert.equal(policies.branch_policies[0].name, "main");
  assert.equal(policies.branch_policies[0].type, "branch");
  for (const name of names) {
    await gh(["secret", "set", name, "--repo", repository, "--env", environment], process.env[name]);
    console.log(`${name}: configured as encrypted environment secret`);
  }
  await gh(["secret", "set", "BACKUP_ENCRYPTION_KEY_BASE64", "--repo", repository, "--env", environment], key.toString("base64"));
  console.log("Existing recovery key configured as encrypted environment secret. No workflow committed, pushed or started.");
}
main().catch((error) => { console.error(error instanceof assert.AssertionError ? "Backup environment validation failed; no secret values displayed." : "GitHub backup configuration failed; credentials withheld. Retry after checking access."); process.exitCode = 1; });
