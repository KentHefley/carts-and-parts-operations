import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { gzipSync, gunzipSync } from "node:zlib";
import { rootCertificates } from "node:tls";
import { Client } from "pg";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { backupCredentials } from "./backup-target";
import { attachmentStorage } from "../lib/attachment-storage";

const root = path.resolve(".recovery");
const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const magic = Buffer.from("CNPBACK1");
type FileEntry = { key: string; size: number; type: string; sha256: string; data: string };
type BackupMode = "development" | "pilot";
type Archive = { version: 1; environment?: BackupMode; capturedAt: string; dump: string; dumpHash: string; tables: Record<string, { count: number; sha256: string }>; files: FileEntry[] };

function connection(databaseUrl: string, database = "neondb") {
  const url = new URL(databaseUrl);
  url.hostname = url.hostname.replace("-pooler", "");
  url.pathname = "/" + database;
  url.searchParams.set("sslmode", "verify-full");
  return url;
}

async function client(url: URL) {
  const db = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 15_000 });
  await db.connect();
  return db;
}

async function command(name: "pg_dump" | "pg_restore", url: URL, args: string[]) {
  const executable = path.resolve(process.env.PG_BIN_DIR ?? ".recovery-tools/bin", name + (process.platform === "win32" ? ".exe" : ""));
  await mkdir(".recovery-tools", { recursive: true });
  const certificates = path.resolve(".recovery-tools", "roots.pem");
  await writeFile(certificates, rootCertificates.join("\n"));
  await new Promise<void>((resolve, reject) => {
    // Never inherit PGOPTIONS/service settings that could redirect or mutate a target.
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (key.startsWith("PG")) delete env[key];
    Object.assign(env, { PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: url.pathname.slice(1), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: "verify-full", PGSSLROOTCERT: certificates, PGCONNECT_TIMEOUT: "15" });
    const child = spawn(executable, args, { env, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let diagnostic = "";
    child.stderr.on("data", (chunk: Buffer) => { diagnostic = (diagnostic + chunk.toString()).slice(-4000); });
    child.once("error", () => reject(new Error(`${name} could not start.`)));
    child.once("exit", (code) => {
      if (code === 0) return resolve();
      for (const value of [url.toString(), decodeURIComponent(url.password), decodeURIComponent(url.username), url.hostname]) {
        if (value) diagnostic = diagnostic.replaceAll(value, "[redacted]");
      }
      diagnostic = diagnostic.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]");
      reject(new Error(`${name} failed with exit ${code}: ${diagnostic.trim()}`));
    });
  });
}

async function fingerprint(db: Client) {
  const names = await db.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  const tables: Archive["tables"] = {};
  for (const { tablename } of names.rows) {
    const rows = await db.query<{ row: string }>(`SELECT to_jsonb(t)::text AS row FROM public.${quote(tablename)} t`);
    const values = rows.rows.map((r) => r.row).sort();
    tables[tablename] = { count: values.length, sha256: hash(JSON.stringify(values)) };
  }
  return tables;
}

async function key(create: boolean) {
  const supplied = process.env.BACKUP_ENCRYPTION_KEY_BASE64;
  if (supplied) {
    assert.match(supplied, /^[A-Za-z0-9+/]{43}=$/, "Invalid configured recovery key.");
    const decoded = Buffer.from(supplied, "base64");
    assert.equal(decoded.length, 32, "Configured recovery key must be 32 bytes.");
    assert.equal(decoded.toString("base64"), supplied, "Invalid configured recovery key encoding.");
    return decoded;
  }
  assert.ok(process.env.CI !== "true", "Scheduled backups require the existing recovery key secret; never generate a replacement.");
  const target = path.join(root, "backup.key");
  if (create) {
    try { await writeFile(target, randomBytes(32), { flag: "wx", mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  }
  const result = await readFile(target);
  assert.equal(result.length, 32, "Recovery key must be 32 bytes.");
  return result;
}

async function backup(url: URL, mode: BackupMode) {
  await mkdir(root, { recursive: true });
  const secret = await key(mode === "development");
  const id = randomBytes(12).toString("hex");
  const dumpPath = path.join(root, `${id}.partial.dump`);
  const db = await client(url);
  try {
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const snapshot = (await db.query<{ snapshot: string }>("SELECT pg_export_snapshot() AS snapshot")).rows[0].snapshot;
    const tables = await fingerprint(db);
    const manifest = await db.query<{ key: string; size: number; type: string }>(`SELECT "storageKey" AS key, size, "contentType" AS type FROM "OrderAttachment" WHERE state='READY' UNION ALL SELECT "storageKey" AS key, size, 'application/pdf' AS type FROM "PriceBookFile" WHERE state='READY' ORDER BY key`);
    await command("pg_dump", url, ["--format=custom", "--no-owner", "--no-acl", `--snapshot=${snapshot}`, `--file=${dumpPath}`]);
    const files: FileEntry[] = [];
    let totalBytes = 0;
    const storage = attachmentStorage();
    for (const file of manifest.rows) {
      assert.ok(file.key.startsWith(`${mode}/`), "Unexpected storage namespace.");
      totalBytes += file.size;
      assert.ok(totalBytes <= 250 * 1024 * 1024, "Pilot backup exceeds the in-memory 250 MB limit.");
      const object = await storage.read(file.key);
      assert.ok(object.Body, "Stored file is missing.");
      const bytes = Buffer.from(await object.Body.transformToByteArray());
      assert.equal(bytes.length, file.size, "Stored file size differs from its database record.");
      files.push({ ...file, sha256: hash(bytes), data: bytes.toString("base64") });
    }
    const dump = await readFile(dumpPath);
    const archive: Archive = { version: 1, environment: mode, capturedAt: new Date().toISOString(), tables, files, dump: dump.toString("base64"), dumpHash: hash(dump) };
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", secret, iv);
    cipher.setAAD(magic);
    const ciphertext = Buffer.concat([cipher.update(gzipSync(JSON.stringify(archive))), cipher.final()]);
    const filename = `${mode}-${id}.cnpbackup`;
    await writeFile(path.join(root, filename), Buffer.concat([magic, iv, cipher.getAuthTag(), ciphertext]), { flag: "wx", mode: 0o600 });
    await db.query("COMMIT");
    console.log(JSON.stringify({ backup: filename, tables: Object.keys(tables).length, files: files.length, fileBytes: totalBytes, encrypted: true }));
  } finally {
    await db.end();
    await unlink(dumpPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  }
}

async function drill(url: URL, filename: string, mode: BackupMode) {
  assert.match(filename, new RegExp(`^${mode}-[a-f0-9]{24}\\.cnpbackup$`));
  const bytes = await readFile(path.join(root, filename));
  assert.ok(bytes.subarray(0, 8).equals(magic), "Unrecognized backup format.");
  const decipher = createDecipheriv("aes-256-gcm", await key(false), bytes.subarray(8, 20));
  decipher.setAAD(magic);
  decipher.setAuthTag(bytes.subarray(20, 36));
  const archive = JSON.parse(gunzipSync(Buffer.concat([decipher.update(bytes.subarray(36)), decipher.final()]), { maxOutputLength: 512 * 1024 * 1024 }).toString()) as Archive;
  assert.equal(archive.version, 1);
  assert.equal(archive.environment ?? "development", mode, "Archive environment differs from restoration target.");
  assert.ok(archive.files.every(file => file.key.startsWith(`${mode}/`)), "Archive file namespace differs from target.");
  const dump = Buffer.from(archive.dump, "base64");
  assert.equal(hash(dump), archive.dumpHash);
  attachmentStorage(); // Existing bucket, credentials and development checks must pass.
  const storage = new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED", maxAttempts: 2 });
  const bucket = process.env.R2_BUCKET_NAME!;
  const id = randomBytes(12).toString("hex");
  const name = `recovery_drill_${id}`;
  assert.match(name, /^recovery_drill_[a-f0-9]{24}$/);
  const prefix = `${mode}/recovery-drills/${id}/`;
  const dumpPath = path.join(root, `${id}.restore.dump`);
  const admin = await client(url);
  let created = false;
  let restored: Client | undefined;
  const ownedKeys: string[] = [];
  let cleanupFailed = false;
  try {
    await admin.query(`CREATE DATABASE ${quote(name)} TEMPLATE template0`);
    created = true;
    const target = new URL(url);
    target.pathname = "/" + name;
    await writeFile(dumpPath, dump, { flag: "wx", mode: 0o600 });
    await command("pg_restore", target, ["--exit-on-error", "--no-owner", "--no-acl", "--dbname=" + name, dumpPath]);
    restored = await client(target);
    assert.deepEqual(await fingerprint(restored), archive.tables, "Restored table contents differ.");
    const associations = await restored.query<{ key: string; size: number }>(`SELECT a."storageKey" AS key, a.size FROM "OrderAttachment" a JOIN "SalesOrder" o ON o.id=a."orderId" JOIN "AppUser" u ON u.id=a."uploaderId" WHERE a.state='READY'`);
    for (const association of associations.rows) {
      const file = archive.files.find((entry) => entry.key === association.key);
      assert.ok(file, "Restored order attachment has no backed-up bytes.");
      assert.equal(file.size, association.size);
    }
    for (const [index, file] of archive.files.entries()) {
      const body = Buffer.from(file.data, "base64");
      assert.equal(body.length, file.size);
      assert.equal(hash(body), file.sha256);
      const targetKey = prefix + index;
      ownedKeys.push(targetKey); // Track before upload so uncertain success is cleaned up.
      await storage.send(new PutObjectCommand({ Bucket: bucket, Key: targetKey, Body: body, ContentType: file.type, CacheControl: "private, no-store", IfNoneMatch: "*" }), { abortSignal: AbortSignal.timeout(60_000) });
      const object = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: targetKey }), { abortSignal: AbortSignal.timeout(60_000) });
      assert.ok(object.Body);
      assert.equal(hash(Buffer.from(await object.Body.transformToByteArray())), file.sha256, "Restored file checksum differs.");
    }
    console.log(JSON.stringify({ restoreVerified: true, tables: Object.keys(archive.tables).length, files: archive.files.length, orderAttachmentAssociations: associations.rows.length, isolatedDatabase: name }));
  } finally {
    await restored?.end();
    for (const ownedKey of ownedKeys) {
      assert.ok(ownedKey.startsWith(prefix));
      try { await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: ownedKey }), { abortSignal: AbortSignal.timeout(30_000) }); }
      catch { cleanupFailed = true; }
    }
    if (created) {
      try { await admin.query(`DROP DATABASE ${quote(name)}`); }
      catch { cleanupFailed = true; }
    }
    await admin.end();
    storage.destroy();
    await unlink(dumpPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    assert.ok(!cleanupFailed, `Drill cleanup incomplete; investigate ${name} and prefix ${prefix}.`);
    console.log("Isolated restoration cleanup completed.");
  }
}

async function main() {
  const { mode, databaseUrl } = backupCredentials();
  const url = connection(databaseUrl);
  if (process.argv[2] === "backup") await backup(url, mode);
  else if (process.argv[2] === "drill" && process.argv[3]) await drill(url, process.argv[3], mode);
  else throw new Error("Use backup, or drill with an archive filename.");
}
main().catch((error: unknown) => {
  // Print only locally constructed validation errors, never raw provider errors.
  const safe = error instanceof assert.AssertionError || (error instanceof Error && /^(pg_dump|pg_restore|Use backup)/.test(error.message));
  console.error(safe && error instanceof Error ? error.message : "Recovery operation failed; provider details and credentials withheld.");
  process.exitCode = 1;
});
