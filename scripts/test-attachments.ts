import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { beginAttachment, finishAttachment, deleteAttachment, cleanupAttachments } from "../lib/attachment-store";
import { attachmentStorage, type AttachmentStorage } from "../lib/attachment-storage";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const orderId = randomUUID();
  const objects = new Map<string, Uint8Array>();
  let failingDelete = false;
  const fake: AttachmentStorage = {
    upload: async () => "https://example.invalid/upload",
    inspect: async key => ({ bytes: objects.get(key)!, size: objects.get(key)!.length, type: "application/pdf", etag: "synthetic-etag" }),
    promote: async (from, to) => { objects.set(to, objects.get(from)!); },
    remove: async key => { if (failingDelete) throw new Error("synthetic failure"); objects.delete(key); },
    read: async () => { throw new Error("not used"); },
  };
  const bytes = Buffer.from("%PDF-1.4\nSynthetic attachment test\n%%EOF");
  let real: AttachmentStorage | undefined;
  const realKeys: string[] = [];
  try {
    for (let i = 0; i < ids.length; i++) await db.appUser.create({ data: { id: ids[i], clerkUserId: `synthetic-attachment-${ids[i]}`, email: `attachment-${ids[i]}@example.invalid`, role: i === 0 ? "ADMIN" : "USER" } });
    await db.salesOrder.create({ data: { id: orderId, creatorId: ids[0], requestKey: randomUUID(), name: "Synthetic attachment permission test", fields: { status: "In Progress" } } });
    await assert.rejects(beginAttachment(db, fake, ids[1], orderId, randomUUID(), "receipt.pdf", bytes.length));
    await db.orderAssignment.create({ data: { orderId, userId: ids[1] } });
    const request = randomUUID();
    const upload = await beginAttachment(db, fake, ids[1], orderId, request, "receipt.pdf", bytes.length);
    assert.equal((await beginAttachment(db, fake, ids[1], orderId, request, "receipt.pdf", bytes.length)).id, upload.id);
    const row = await db.orderAttachment.findUniqueOrThrow({ where: { id: upload.id } });
    objects.set(row.stagingKey, bytes);
    await db.orderAssignment.deleteMany({ where: { orderId } });
    await assert.rejects(finishAttachment(db, fake, ids[1], orderId, upload.id));
    await db.orderAssignment.create({ data: { orderId, userId: ids[1] } });
    objects.set(row.stagingKey, Buffer.alloc(bytes.length));
    await assert.rejects(finishAttachment(db, fake, ids[1], orderId, upload.id));
    objects.set(row.stagingKey, bytes);
    await finishAttachment(db, fake, ids[1], orderId, upload.id);
    await finishAttachment(db, fake, ids[1], orderId, upload.id);
    assert.equal(await db.orderEvent.count({ where: { orderId } }), 1);
    assert.deepEqual(objects.get(row.storageKey), bytes);
    await assert.rejects(deleteAttachment(db, fake, ids[2], orderId, upload.id));
    for (const status of ["Complete", "Voided", "In Progress"]) {
      await db.salesOrder.update({ where: { id: orderId }, data: { fields: { status } } });
      assert.equal((await db.orderAttachment.findUniqueOrThrow({ where: { id: upload.id } })).state, "READY");
    }
    failingDelete = true;
    assert.equal(await deleteAttachment(db, fake, ids[0], orderId, upload.id), false);
    assert.equal((await db.orderAttachment.findUniqueOrThrow({ where: { id: upload.id } })).state, "DELETING");
    failingDelete = false;
    await deleteAttachment(db, fake, ids[0], orderId, upload.id);
    assert.equal(await db.orderEvent.count({ where: { orderId } }), 2);
    await db.orderAttachment.update({ where: { id: upload.id }, data: { expiresAt: new Date(0) } });
    await cleanupAttachments(db, fake, orderId);
    assert.equal(objects.size, 0);
    await db.appUser.update({ where: { id: ids[1] }, data: { active: false } });
    await assert.rejects(beginAttachment(db, fake, ids[1], orderId, randomUUID(), "receipt.pdf", bytes.length));
    console.log("Synthetic attachment checks passed: assignments, inactive users, type validation, idempotency, status retention and cleanup recovery.");

    if (process.argv.includes("--r2")) {
      real = attachmentStorage();
      const upload = await beginAttachment(db, real, ids[0], orderId, randomUUID(), "synthetic-receipt.pdf", bytes.length);
      const record = await db.orderAttachment.findUniqueOrThrow({ where: { id: upload.id } });
      realKeys.push(record.stagingKey, record.storageKey);
      const preflight = await fetch(upload.url, { method: "OPTIONS", headers: { Origin: "http://localhost:3000", "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type" } });
      console.log("Browser CORS configured: " + (preflight.headers.get("access-control-allow-origin") === "http://localhost:3000"));
      const result = await fetch(upload.url, { method: "PUT", headers: { "Content-Type": upload.contentType }, body: bytes });
      assert.equal(result.ok, true, `R2 synthetic upload returned ${result.status}`);
      await finishAttachment(db, real, ids[0], orderId, upload.id);
      const file = await real.read(record.storageKey);
      assert.deepEqual(Buffer.from(await file.Body!.transformToByteArray()), bytes);
      assert.equal(await deleteAttachment(db, real, ids[0], orderId, upload.id), true);
      console.log("Real development R2 synthetic upload, verification/copy, original-byte read and deletion passed.");
    }
  } finally {
    if (real) for (const key of realKeys) await real.remove(key);
    await db.orderAttachment.deleteMany({ where: { orderId } });
    await db.notification.deleteMany({ where: { OR: [{ orderId }, { actorId: { in: ids } }, { recipientId: { in: ids } }] } });
    await db.orderEvent.deleteMany({ where: { orderId } });
    await db.orderAssignment.deleteMany({ where: { orderId } });
    await db.salesOrder.deleteMany({ where: { id: orderId } });
    await db.appUser.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
}
main().catch(() => { console.error("Attachment test failed; no credentials or signed URLs logged."); process.exitCode = 1; });
