import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { backupPattern } from "./backup-retention.mjs";

async function run(script, args) {
  return new Promise((resolve, reject) => {
    const command = script.endsWith(".ts") ? ["node_modules/tsx/dist/cli.mjs", script, ...args] : [script, ...args];
    const child = spawn(process.execPath, command, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.resume();
    child.once("error", () => reject(new Error("Backup command could not start.")));
    child.once("exit", (code) => code === 0 ? resolve(output) : reject(new Error("Daily backup failed; no further retention cleanup performed. Check credentials/provider availability and retry.")));
  });
}
try {
  const mode = process.env.BACKUP_ENV ?? "development";
  const pattern = backupPattern(mode);
  const output = await run("scripts/backup-development.ts", ["backup"]);
  const filename = JSON.parse(output.trim()).backup;
  assert.ok(pattern.test(filename), "Backup filename differs from environment.");
  assert.ok(filename, "Encrypted backup filename missing.");
  const result = await run("scripts/upload-dropbox-backup.mjs", [filename, "--cleanup"]);
  console.log(result.trim());
} catch {
  console.error("Daily backup failed. Retention runs only after successful creation/upload/download verification. Credentials withheld.");
  process.exitCode = 1;
}
