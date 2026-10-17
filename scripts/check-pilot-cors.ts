import assert from "node:assert/strict";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { pilotCredentials } from "./pilot-target";

async function main() {
  const env = pilotCredentials();
  const origin = "https://carts-and-parts-operations-pilot.vercel.app";
  assert.equal(env.APP_URL, origin);
  const client = new S3Client({ region: "auto", endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }, requestChecksumCalculation: "WHEN_REQUIRED", maxAttempts: 1 });
  try {
    const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: `pilot/setup-checks/${randomUUID()}.pdf`, ContentType: "application/pdf" }), { expiresIn: 60 });
    // OPTIONS only: no upload or file creation; never log the signed URL.
    const response = await fetch(url, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type" }, signal: AbortSignal.timeout(20_000) });
    assert.ok(response.ok);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.ok((response.headers.get("access-control-allow-methods") || "").split(",").some(value => value.trim().toUpperCase() === "PUT"));
    assert.ok((response.headers.get("access-control-allow-headers") || "").toLowerCase().split(",").some(value => value.trim() === "content-type"));
    const denied = await fetch(url, { method: "OPTIONS", headers: { Origin: "https://unapproved.example", "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type" }, signal: AbortSignal.timeout(20_000) });
    assert.notEqual(denied.headers.get("access-control-allow-origin"), "*");
    assert.notEqual(denied.headers.get("access-control-allow-origin"), "https://unapproved.example");
    console.log("Pilot CORS passed: exact hosted origin, PUT/content-type allowed; unapproved origin denied. No files uploaded.");
  } finally { client.destroy(); }
}
main().catch(() => { console.error("Pilot CORS verification failed; review the bucket policy. No credentials or signed URLs logged."); process.exitCode = 1; });
