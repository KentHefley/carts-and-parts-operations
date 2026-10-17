import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { runtimeEnvironment } from "./environment-policy";

// Deliberately fails closed outside the explicitly enrolled non-live environments.
export function attachmentStorage() {
  const account = process.env.R2_ACCOUNT_ID;
  const { bucket } = runtimeEnvironment();
  if (!account || !/^[0-9a-f]{32}$/i.test(account) || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) throw new Error("Private file storage is not configured.");
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
