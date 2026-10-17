import { config } from "dotenv";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import assert from "node:assert/strict";

config({ path: ".env.local", quiet: true });
config({ path: ".env.backup.local", quiet: true });
const pendingPath = ".recovery/dropbox-authorization.json";
const appKey = process.env.DROPBOX_APP_KEY?.trim();
const appSecret = process.env.DROPBOX_APP_SECRET?.trim();
const scopes = ["files.metadata.read", "files.content.write", "files.content.read"];

async function main() {
  assert.ok(appKey && appSecret, "Dropbox app settings are missing.");
  if (process.argv[2] === "prepare") {
    await mkdir(".recovery", { recursive: true });
    const verifier = randomBytes(48).toString("base64url");
    await writeFile(pendingPath, JSON.stringify({ verifier, appKey, createdAt: Date.now() }), { mode: 0o600 });
    const url = new URL("https://www.dropbox.com/oauth2/authorize");
    url.search = new URLSearchParams({ client_id: appKey, response_type: "code", token_access_type: "offline", scope: scopes.join(" "), code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
    // App key and PKCE challenge are public; no secret or verifier is printed.
    console.log(url.toString());
    return;
  }
  assert.equal(process.argv[2], "exchange", "Use prepare or exchange.");
  const pending = JSON.parse(await readFile(pendingPath, "utf8"));
  assert.equal(pending.appKey, appKey, "App settings changed; prepare again.");
  assert.ok(Date.now() - pending.createdAt < 15 * 60_000, "Authorization setup expired; prepare again.");
  const code = process.env.DROPBOX_AUTHORIZATION_CODE?.trim();
  assert.ok(code, "Save DROPBOX_AUTHORIZATION_CODE in .env.local first.");
  const response = await fetch("https://api.dropbox.com/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: appKey, client_secret: appSecret, code_verifier: pending.verifier }), signal: AbortSignal.timeout(30_000) });
  assert.ok(response.ok, "Dropbox authorization failed; prepare a new authorization code.");
  const result = await response.json();
  assert.ok(typeof result.refresh_token === "string" && result.refresh_token.length > 0, "Dropbox did not return renewable access.");
  const granted = new Set(String(result.scope ?? "").split(" "));
  assert.ok(scopes.every((scope) => granted.has(scope)), "Required Dropbox permissions were not granted.");
  const contents = await readFile(".env.local", "utf8");
  const lines = contents.split(/\r?\n/).filter((line) => !/^\s*(?:export\s+)?DROPBOX_(?:REFRESH_TOKEN|AUTHORIZATION_CODE)\s*=/.test(line));
  await writeFile(".env.backup.local", `# Private Dropbox renewable backup access\nDROPBOX_REFRESH_TOKEN=${JSON.stringify(result.refresh_token)}\n`, { mode: 0o600 });
  await writeFile(".env.local", lines.join("\n"));
  await unlink(pendingPath);
  console.log("Dropbox renewable access saved in .env.backup.local. One-time code removed. No backup uploaded.");
}
main().catch((error) => { console.error(error instanceof assert.AssertionError ? error.message : "Dropbox authorization failed; sensitive details withheld."); process.exitCode = 1; });
