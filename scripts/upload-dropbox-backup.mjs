import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { config } from "dotenv";
import { cleanupExpiredBackups } from "./backup-retention.mjs";

config({ path: ".env.local", quiet: true });
config({ path: ".env.backup.local", quiet: true });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function main() {
  const filename = process.argv[2];
  assert.match(filename ?? "", /^development-[a-f0-9]{24}\.cnpbackup$/, "Supply a development encrypted archive filename.");
  const bytes = await readFile(`.recovery/${filename}`);
  assert.ok(bytes.subarray(0, 8).equals(Buffer.from("CNPBACK1")), "Only encrypted recovery archives may be uploaded.");
  assert.ok(bytes.length < 150 * 1024 * 1024, "Archive needs Dropbox upload-session support.");
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  assert.ok(clientId && clientSecret && refreshToken, "Dropbox authorization is not configured.");
  const tokenResponse = await fetch("https://api.dropbox.com/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret }), signal: AbortSignal.timeout(30_000) });
  assert.ok(tokenResponse.ok, "Dropbox could not renew access.");
  const token = await tokenResponse.json();
  assert.ok(typeof token.access_token === "string", "Dropbox access response was incomplete.");
  const authorization = `Bearer ${token.access_token}`;
  const rpc = async (endpoint, body) => {
    const response = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, { method: "POST", headers: { Authorization: authorization, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
    assert.ok(response.ok, `Dropbox backup maintenance failed (HTTP ${response.status}); remaining files preserved.`);
    return response.json();
  };
  const target = `/${filename}`;
  // Add + strict_conflict never overwrites an existing archive. No public links are created.
  const verifyOnly = process.argv.includes("--verify");
  const upload = verifyOnly
    ? await fetch("https://api.dropboxapi.com/2/files/get_metadata", { method: "POST", headers: { Authorization: authorization, "content-type": "application/json" }, body: JSON.stringify({ path: target }), signal: AbortSignal.timeout(30_000) })
    : await fetch("https://content.dropboxapi.com/2/files/upload", { method: "POST", headers: { Authorization: authorization, "content-type": "application/octet-stream", "Dropbox-API-Arg": JSON.stringify({ path: target, mode: "add", autorename: false, strict_conflict: true, mute: true }) }, body: bytes, signal: AbortSignal.timeout(180_000) });
  assert.ok(upload.ok, "Dropbox upload failed or the archive already exists; no existing file overwritten.");
  const metadata = await upload.json();
  assert.equal(metadata.size, bytes.length, "Dropbox reported a different file size.");
  assert.ok(typeof metadata.id === "string" && typeof metadata.rev === "string", "Dropbox file identity is missing.");
  const download = await fetch("https://content.dropboxapi.com/2/files/download", { method: "POST", headers: { Authorization: authorization, "Dropbox-API-Arg": JSON.stringify({ path: target }) }, signal: AbortSignal.timeout(180_000) });
  if (!download.ok) {
    const detail = await download.text();
    const category = ["missing_scope", "invalid_access_token", "not_found", "rev", "Content-Type"].find((value) => detail.includes(value)) ?? "unspecified";
    throw new assert.AssertionError({ message: `Verification download failed (HTTP ${download.status}, ${category}); local backup preserved.` });
  }
  const downloadedMetadata = JSON.parse(download.headers.get("Dropbox-API-Result") ?? "{}");
  assert.equal(downloadedMetadata.id, metadata.id, "Backup identity changed before verification.");
  assert.equal(downloadedMetadata.rev, metadata.rev, "Backup revision changed before verification.");
  const restored = Buffer.from(await download.arrayBuffer());
  assert.equal(sha256(restored), sha256(bytes), "Dropbox backup checksum differs; do not delete local backup.");
  const expiredBackupsDeleted = process.argv.includes("--cleanup") ? await cleanupExpiredBackups(rpc, metadata) : 0;
  console.log(JSON.stringify({ uploaded: filename, bytes: bytes.length, downloadChecksumVerified: true, encrypted: true, recoveryKeyUploaded: false, expiredBackupsDeleted }));
}
main().catch((error) => { console.error(error instanceof assert.AssertionError ? error.message : "Dropbox backup transfer failed; credentials withheld. Local archive preserved."); process.exitCode = 1; });
