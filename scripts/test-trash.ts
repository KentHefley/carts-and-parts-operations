import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { trashOrder, restoreOrder, listTrash, purgeExpiredOrders } from "../lib/trash-store";
import { saveOrder, loadOrder, listOrders, reserveOrder } from "../lib/order-store";
import { beginAttachment, finishAttachment } from "../lib/attachment-store";
import { attachmentStorage, type AttachmentStorage } from "../lib/attachment-storage";
import { sendQueuedEmail, queueOrderEmail } from "../lib/order-email-store";
import { readActivity } from "../lib/activity-store";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  // Recover only orphaned users from an interrupted run of this exact synthetic test.
  await db.appUser.deleteMany({ where: { clerkUserId: { startsWith: "synthetic-trash-" }, email: { endsWith: "@example.invalid" }, orders: { none: {} }, events: { none: {} }, assignments: { none: {} }, notifications: { none: {} }, sentNotifications: { none: {} }, emails: { none: {} }, attachments: { none: {} } } });
  const users = [randomUUID(), randomUUID(), randomUUID()];
  const id = randomUUID(), key = randomUUID();
  const bytes = Buffer.from("%PDF-1.4\nSynthetic Trash retention test\n%%EOF");
  const objects = new Map<string, Uint8Array>();
  let fail = false;
  let failureKey: string | undefined;
  const fake: AttachmentStorage = {
    upload: async () => "https://example.invalid/upload",
    inspect: async path => ({ bytes: objects.get(path)!, size: bytes.length, type: "application/pdf", etag: "test-etag" }),
    promote: async (from, to) => { objects.set(to, objects.get(from)!); },
    remove: async path => { if (fail || path === failureKey) throw new Error("synthetic storage outage"); objects.delete(path); },
    read: async () => { throw new Error("not used"); },
  };
  let real: AttachmentStorage | undefined;
  const realKeys: string[] = [];
  try {
    for (let i = 0; i < users.length; i++) await db.appUser.create({ data: { id: users[i], clerkUserId: `synthetic-trash-${users[i]}`, email: `trash-${users[i]}@example.invalid`, role: i === 0 ? "ADMIN" : "USER" } });
    await db.salesOrder.create({ data: { id, requestKey: key, creatorId: users[1], name: "Synthetic Trash test", fields: { status: "Complete", text_79__1: "Synthetic closer", closed_out_date4__1: "2026-10-11" }, items: { create: [0, 1, 2].map(position => ({ position, description: "Retained synthetic item" })) }, assignments: { create: { userId: users[2] } } } });
    const original = await loadOrder(db, id);
    const upload = await beginAttachment(db, fake, users[0], id, randomUUID(), "synthetic.pdf", bytes.length);
    const file = await db.orderAttachment.findUniqueOrThrow({ where: { id: upload.id } });
    objects.set(file.stagingKey, bytes);
    await finishAttachment(db, fake, users[0], id, upload.id);
    const pending = await beginAttachment(db, fake, users[0], id, randomUUID(), "pending.pdf", bytes.length);
    const email = await db.orderEmail.create({ data: { orderId: id, actorId: users[1], requestKey: randomUUID(), payload: {} } });
    await assert.rejects(trashOrder(db, users[2], id));
    await assert.rejects(listTrash(db, users[1]));
    await db.orderEmail.update({ where: { id: email.id }, data: { state: "SENDING", lastAttemptAt: new Date() } });
    await assert.rejects(trashOrder(db, users[1], id));
    await db.orderEmail.update({ where: { id: email.id }, data: { state: "PENDING" } });
    await trashOrder(db, users[1], id);
    const trashed = await db.salesOrder.findUniqueOrThrow({ where: { id } });
    assert.equal(trashed.purgeAfter!.getTime() - trashed.deletedAt!.getTime(), 30 * 24 * 60 * 60 * 1000);
    await trashOrder(db, users[1], id);
    assert.equal((await db.salesOrder.findUniqueOrThrow({ where: { id } })).purgeAfter!.getTime(), trashed.purgeAfter!.getTime());
    assert.equal((await listOrders(db, true)).some(order => order.id === id), false);
    await assert.rejects(loadOrder(db, id));
    await assert.rejects(reserveOrder(db, users[1], key));
    assert.equal((await saveOrder(db, users[1], { id, base: original.fields, patch: { name: "stale edit" } })).ok, false);
    assert.equal((await readActivity(db, { orderId: id })).events.length, 0);
    assert.equal(await db.orderAttachment.count({ where: { orderId: id, state: "READY", order: { deletedAt: null } } }), 0);
    await assert.rejects(beginAttachment(db, fake, users[0], id, randomUUID(), "blocked.pdf", bytes.length));
    await assert.rejects(finishAttachment(db, fake, users[0], id, pending.id));
    await assert.rejects(sendQueuedEmail(db, users[1], email.id, async () => { throw new Error("must not send"); }));
    await assert.rejects(queueOrderEmail(db, users[1], original, randomUUID()));
    await assert.rejects(restoreOrder(db, users[1], id));
    await db.appUser.update({ where: { id: users[2] }, data: { active: false } });
    assert.equal((await listTrash(db, users[0])).find(order => order.id === id)!.assignments[0].user.active, false);
    assert.equal((await purgeExpiredOrders(db, fake, id)).checked, 0);
    assert.deepEqual(objects.get(file.storageKey), bytes);
    await restoreOrder(db, users[0], id);
    await restoreOrder(db, users[0], id);
    assert.deepEqual(await loadOrder(db, id), original);
    assert.equal((await listOrders(db, true)).some(order => order.id === id), true);
    assert.equal((await db.orderAttachment.findUniqueOrThrow({ where: { id: file.id } })).state, "READY");
    await db.appUser.update({ where: { id: users[1] }, data: { active: false } });
    await assert.rejects(trashOrder(db, users[1], id));
    await trashOrder(db, users[0], id);
    // Force only the synthetic order to the exact expiry boundary; never alter company orders.
    await db.salesOrder.update({ where: { id }, data: { purgeAfter: new Date() } });
    await assert.rejects(restoreOrder(db, users[0], id));
    await db.orderAttachment.updateMany({ where: { orderId: id }, data: { expiresAt: new Date(0) } });
    fail = true;
    assert.equal((await purgeExpiredOrders(db, fake, id)).purged, 0);
    assert.ok((await db.salesOrder.findUniqueOrThrow({ where: { id } })).purgingAt);
    assert.equal(await db.orderAttachment.count({ where: { orderId: id } }), 2);
    await assert.rejects(restoreOrder(db, users[0], id));
    fail = false;
    failureKey = file.storageKey;
    assert.equal((await purgeExpiredOrders(db, fake, id)).purged, 0);
    const partiallyCleaned = await db.orderAttachment.findUniqueOrThrow({ where: { id: file.id } });
    assert.ok(partiallyCleaned.stagingCleanedAt);
    assert.equal(partiallyCleaned.objectCleanedAt, null);
    failureKey = undefined;
    assert.equal((await purgeExpiredOrders(db, fake, id)).purged, 1);
    assert.equal(objects.size, 0);
    const tombstone = await db.salesOrder.findUniqueOrThrow({ where: { id } });
    assert.ok(tombstone.purgedAt);
    assert.equal(tombstone.number, trashed.number);
    assert.equal(tombstone.name, null);
    assert.deepEqual(tombstone.fields, {});
    for (const count of await Promise.all([db.orderItem.count({ where: { orderId: id } }), db.orderAssignment.count({ where: { orderId: id } }), db.orderEmail.count({ where: { orderId: id } }), db.orderEvent.count({ where: { orderId: id } }), db.notification.count({ where: { orderId: id } }), db.orderAttachment.count({ where: { orderId: id } })])) assert.equal(count, 0);
    assert.equal((await purgeExpiredOrders(db, fake, id)).checked, 0);
    console.log("Synthetic Trash checks passed: permissions, 30-day boundary, stale edits/email/uploads, hiding, unchanged restoration, inactive assignments, failure/retry and minimal audit.");

    if (process.argv.includes("--r2")) {
      // Reuse the synthetic row only, restoring its test fields directly for a separate storage test.
      await db.salesOrder.update({ where: { id }, data: { name: "Synthetic R2 Trash cleanup", fields: { status: "In Progress" }, deletedAt: null, deletedById: null, purgeAfter: null, purgingAt: null, purgedAt: null } });
      real = attachmentStorage();
      const ticket = await beginAttachment(db, real, users[0], id, randomUUID(), "trash-test.pdf", bytes.length);
      const stored = await db.orderAttachment.findUniqueOrThrow({ where: { id: ticket.id } });
      realKeys.push(stored.stagingKey, stored.storageKey);
      const result = await fetch(ticket.url, { method: "PUT", headers: { "Content-Type": ticket.contentType }, body: bytes });
      assert.equal(result.ok, true);
      await finishAttachment(db, real, users[0], id, ticket.id);
      await trashOrder(db, users[0], id);
      assert.equal((await purgeExpiredOrders(db, real, id)).checked, 0);
      assert.deepEqual(Buffer.from(await (await real.read(stored.storageKey)).Body!.transformToByteArray()), bytes);
      await db.salesOrder.update({ where: { id }, data: { purgeAfter: new Date(0) } });
      await db.orderAttachment.update({ where: { id: ticket.id }, data: { expiresAt: new Date(0) } });
      assert.equal((await purgeExpiredOrders(db, real, id)).purged, 1);
      await assert.rejects(real.read(stored.storageKey));
      await assert.rejects(real.read(stored.stagingKey));
      console.log("Real development R2 Trash retention and permanent staging/final deletion passed.");
    }
  } finally {
    if (real) for (const path of realKeys) await real.remove(path);
    await db.orderAttachment.deleteMany({ where: { orderId: id } });
    await db.orderEmail.deleteMany({ where: { orderId: id } });
    await db.notification.deleteMany({ where: { OR: [{ orderId: id }, { recipientId: { in: users } }, { actorId: { in: users } }] } });
    await db.orderAssignment.deleteMany({ where: { orderId: id } });
    await db.orderItem.deleteMany({ where: { orderId: id } });
    await db.orderEvent.deleteMany({ where: { orderId: id } });
    await db.salesOrder.deleteMany({ where: { id } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : `Trash verification failed (${error?.code ?? "unknown"}); no credentials or signed URLs logged.`); process.exitCode = 1; });
