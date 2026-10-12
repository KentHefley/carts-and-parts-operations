import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Deliberately fails closed outside the configured development environment.
export function attachmentStorage() {
  const account = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const database = new URL(process.env.DATABASE_URL ?? "https://invalid");
  if (!account || !/^[0-9a-f]{32}$/i.test(account) || bucket !== "carts-parts-operations-development" || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") || database.hostname !== "ep-bold-sky-b5e3vwct-pooler.c-7.us-east-2.aws.neon.tech" || database.pathname !== "/neondb") throw new Error("Development file storage is not configured.");
  const client = new S3Client({ region: "auto", endpoint: `https://${account}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED", maxAttempts: 2 });
  return {
    upload: (key: string, type: string, size: number, expiresIn = 600) => getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: type, ContentLength: size }), { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) }),
    async inspect(key: string) {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(15_000) });
      const prefix = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-31", IfMatch: head.ETag }), { abortSignal: AbortSignal.timeout(15_000) });
      return { size: head.ContentLength, type: head.ContentType, etag: head.ETag, bytes: await prefix.Body!.transformToByteArray() };
    },
    async promote(staging: string, key: string, etag: string, type: string) {
      await client.send(new CopyObjectCommand({ Bucket: bucket, Key: key, CopySource: `${bucket}/${staging}`, CopySourceIfMatch: etag, MetadataDirective: "REPLACE", ContentType: type, CacheControl: "private, no-store" }), { abortSignal: AbortSignal.timeout(15_000) });
    },
    async remove(key: string) { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(15_000) }); },
    async read(key: string, range?: string, etag?: string) { return client.send(new GetObjectCommand({ Bucket: bucket, Key: key, ...(range ? { Range: range } : {}), ...(etag ? { IfMatch: etag } : {}) }), { abortSignal: AbortSignal.timeout(15_000) }); },
  };
}
export type AttachmentStorage = ReturnType<typeof attachmentStorage>;
