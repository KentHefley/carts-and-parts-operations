import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { productionCredentials } from "./production-target";

const projectId = "prj_bIdQIZ4SSKkgAQOxHQzqZHjA848W";
const teamId = "team_BILBKtR9HGBoDRxhFt3WJDew";

function vercel(args: string[], input?: string) {
  if (args.some(arg => !/^[a-zA-Z0-9_./?=&,@:-]+$/.test(arg))) throw new Error("Invalid CLI argument.");
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", ["npx", "--offline", "vercel@64.5.0", ...args,
    "--global-config", ".vercel/company-auth", "--scope", "carts-and-parts", "--non-interactive"].join(" ")], {
    windowsHide: true, encoding: "utf8", input, stdio: "pipe", timeout: 90_000,
  });
  if (result.error || result.status !== 0) throw new Error("Production project configuration failed.");
  return result.stdout;
}

function main() {
  const env = productionCredentials();
  const project = JSON.parse(vercel(["api", `/v9/projects/${projectId}?teamId=${teamId}`]));
  if (project.id !== projectId || project.accountId !== teamId || project.name !== "carts-and-parts-operations") {
    throw new Error("Production project identity mismatch.");
  }
  const existing = JSON.parse(vercel(["api", `/v10/projects/${projectId}/env?teamId=${teamId}`]));
  const config = ["APP_ENV", "NEXT_PUBLIC_APP_ENV", "APP_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "R2_BUCKET_NAME"];
  const secrets = ["DATABASE_URL", "CLERK_SECRET_KEY", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "RESEND_API_KEY", "CRON_SECRET"];
  if (!env.CRON_SECRET) {
    env.CRON_SECRET = randomBytes(32).toString("hex");
    writeFileSync(".env.production.local", `${readFileSync(".env.production.local", "utf8").trimEnd()}\nCRON_SECRET=${env.CRON_SECRET}\n`);
  }
  if (env.CRON_SECRET.length < 32 || !env.RESEND_API_KEY?.startsWith("re_")) throw new Error("Production secrets incomplete.");
  for (const name of [...config, ...secrets]) {
    if (!env[name]?.trim()) throw new Error("Required production value missing.");
    const found = existing.envs.find((entry: { key: string; target: string[] }) => entry.key === name && entry.target.includes("production"));
    // A partial setup can resume. Existing values require explicit review before replacement.
    if (found) { console.log(`${name}: already configured; retained`); continue; }
    vercel(["env", "add", name, "production", "--project", projectId, "--type", secrets.includes(name) ? "secret" : "config", "--yes"], env[name]);
    console.log(`${name}: configured`);
  }
  console.log("Production variables configured.");
}
try { main(); } catch { console.error("Production configuration stopped. Review project and variable metadata. Secret values withheld."); process.exitCode = 1; }
