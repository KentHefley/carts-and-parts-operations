import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parse } from "dotenv";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

async function main() {
  const pilot = parse(await readFile(".env.pilot.local"));
  const development = parse(await readFile(".env.local"));
  assert.equal(pilot.R2_BUCKET_NAME, "carts-parts-operations-pilot");
  assert.match(pilot.R2_ACCOUNT_ID ?? "", /^[a-f0-9]{32}$/i);
  assert.ok(pilot.R2_ACCESS_KEY_ID && pilot.R2_SECRET_ACCESS_KEY);
  assert.notEqual(pilot.R2_ACCESS_KEY_ID, development.R2_ACCESS_KEY_ID);
  assert.notEqual(new URL(pilot.DATABASE_URL).hostname.replace("-pooler", ""), new URL(development.DATABASE_URL).hostname.replace("-pooler", ""));
  const client = new S3Client({ region: "auto", endpoint: `https://${pilot.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: pilot.R2_ACCESS_KEY_ID, secretAccessKey: pilot.R2_SECRET_ACCESS_KEY }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED", maxAttempts: 2 });
  const bucket = pilot.R2_BUCKET_NAME;
  const key = `pilot/setup-checks/${randomUUID()}.txt`;
  const bytes = Buffer.from("Carts and Parts pilot storage verification. Synthetic disposable file.");
  let attemptedUpload = false;
  try {
    await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }), { abortSignal: AbortSignal.timeout(30_000) });
    let denied = false;
    try { await client.send(new ListObjectsV2Command({ Bucket: "carts-parts-operations-development", MaxKeys: 1 }), { abortSignal: AbortSignal.timeout(30_000) }); }
    catch (error) { denied = error?.$metadata?.httpStatusCode === 403; }
    assert.ok(denied, "Pilot credential restriction to development bucket was not verified; review token scope.");
    attemptedUpload = true;
    try { await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: "text/plain", CacheControl: "private, no-store", IfNoneMatch: "*" }), { abortSignal: AbortSignal.timeout(30_000) }); }
    catch (error) { if (error?.$metadata?.httpStatusCode === 412) attemptedUpload = false; throw error; }
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(30_000) });
    assert.ok(object.Body);
    assert.ok(Buffer.from(await object.Body.transformToByteArray()).equals(bytes), "Pilot stored bytes differ.");
    console.log("Pilot upload/read passed; pilot credentials denied access to the development bucket.");
  } finally {
    if (attemptedUpload) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(30_000) });
      let missing = false;
      try { await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(30_000) }); }
      catch (error) { missing = error?.$metadata?.httpStatusCode === 404; }
      assert.ok(missing, "Pilot disposable file cleanup could not be verified.");
      console.log("Pilot disposable file deletion verified.");
    }
    client.destroy();
  }
}
main().catch(() => { console.error("Pilot storage verification failed; credentials withheld. Review pilot token scope and bucket settings."); process.exitCode = 1; });
