import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { pilotCredentials } from "./pilot-target";
import { runtimeEnvironment, pilotAllowlist } from "../lib/environment-policy";

const projectId = "prj_JNid49dzev0RZ6FSKlHrPZxrAeOj";
const teamId = "team_BILBKtR9HGBoDRxhFt3WJDew";
const domain = "carts-and-parts-operations-pilot.vercel.app";
const common = ["--global-config", ".vercel/company-auth", "--scope", "carts-and-parts", "--non-interactive"];

async function vercel(args: string[], input = "") {
  // Only fixed command words/validated variable names enter argv; secret values use stdin.
  assert.ok(args.every(arg => /^[a-zA-Z0-9_./?=&,@:-]+$/.test(arg)));
  return new Promise<string>((resolve, reject) => {
    const child = spawn("cmd.exe", ["/d", "/s", "/c", ["npx", "--offline", "vercel@64.5.0", ...args, ...common].join(" ")], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk.toString(); });
    child.stderr.resume(); // CLI diagnostics may contain provider details; never echo them.
    const timeout = setTimeout(() => { child.kill(); reject(new Error("Vercel command timed out; inspect variable metadata before retrying.")); }, 90_000);
    child.once("error", () => { clearTimeout(timeout); reject(new Error("Vercel CLI could not start.")); });
    child.once("exit", code => { clearTimeout(timeout); if (code === 0) resolve(output); else reject(new Error("Vercel configuration failed; inspect variable metadata before retrying.")); });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

async function main() {
  const link = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
  assert.equal(link.projectId, projectId); assert.equal(link.orgId, teamId);
  const env = pilotCredentials();
  runtimeEnvironment(env);
  assert.ok(env.RESEND_API_KEY?.startsWith("re_"));
  assert.equal(pilotAllowlist(env.INVITATION_ALLOWED_RECIPIENTS).length, 3);
  assert.equal(pilotAllowlist(env.SO_EMAIL_ALLOWED_RECIPIENTS).length, 3);
  const domains = JSON.parse(await vercel(["api", `/v9/projects/${projectId}/domains?teamId=${teamId}`]));
  assert.ok(domains.domains.some((item: { name: string; projectId: string; verified: boolean }) => item.name === domain && item.projectId === projectId && item.verified));
  const path = ".env.pilot.local";
  let source = readFileSync(path, "utf8");
  for (const [name, value] of Object.entries({ APP_URL: `https://${domain}`, CRON_SECRET: env.CRON_SECRET || randomBytes(32).toString("hex") })) {
    assert.ok(name !== "CRON_SECRET" || value.length >= 32);
    source = new RegExp(`^${name}=.*$`, "m").test(source) ? source.replace(new RegExp(`^${name}=.*$`, "m"), `${name}=${value}`) : `${source}\n${name}=${value}\n`;
    env[name] = value;
  }
  writeFileSync(path, source);
  const config = ["APP_ENV", "NEXT_PUBLIC_APP_ENV", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "APP_URL", "R2_BUCKET_NAME", "INVITATION_ALLOWED_RECIPIENTS", "SO_EMAIL_ALLOWED_RECIPIENTS"];
  const secrets = ["DATABASE_URL", "CLERK_SECRET_KEY", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "RESEND_API_KEY", "CRON_SECRET"];
  for (const name of [...config, ...secrets]) {
    assert.ok(env[name]?.trim(), `${name} missing`);
    await vercel(["env", "add", name, "production", "--project", projectId, "--type", secrets.includes(name) ? "secret" : "config", "--yes"], env[name]);
    console.log(`${name}: configured for pilot project's production target (${secrets.includes(name) ? "Secret" : "Config"})`);
  }
  console.log("Pilot configuration stored. Preview/development targets untouched. No deployment or outbound messages performed.");
}
main().catch(() => { console.error("Pilot Vercel configuration stopped; values withheld. Check target and variable metadata before retrying; existing variables are never overwritten."); process.exitCode = 1; });
