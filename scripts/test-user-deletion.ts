import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";
import { deleteUserLogin, type LoginDeletionProvider } from "../lib/user-deletion";
import { saveUserAccess } from "../lib/user-management";
import { approvedAccess } from "../lib/access-policy";

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const users: string[] = [], orders: string[] = [];
  let calls = 0, failure = false;
  const provider: LoginDeletionProvider = { remove: async id => {
    assert.ok(id.startsWith("user-deletion-test-")); calls++;
    if (failure) throw new Error("Synthetic provider failure");
  } };
  try {
    const owner = await db.appUser.findUniqueOrThrow({ where: { email: "kent@cartsandparts.com" } });
    assert.ok(owner.active && owner.role === "ADMIN");
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `user-deletion-test-${randomUUID()}`, email: `user-deletion-${randomUUID()}@example.invalid`, displayName: "Synthetic Former Employee", role } })).id);
    let target = await db.appUser.findUniqueOrThrow({ where: { id: users[1] } });
    const input = { id: target.id, expectedUpdatedAt: target.updatedAt.toISOString() };
    await assert.rejects(deleteUserLogin(db, provider, users[0], input), /Only the Super Admin/);
    await assert.rejects(deleteUserLogin(db, provider, users[1], input), /Only the Super Admin/);
    await assert.rejects(deleteUserLogin(db, provider, owner.id, { id: owner.id, expectedUpdatedAt: owner.updatedAt.toISOString() }), /cannot be deleted/);
    assert.equal(calls, 0);
    await saveUserAccess(db, users[0], { id: target.id, expectedRole: "USER", expectedActive: true, role: "USER", active: false });
    await assert.rejects(deleteUserLogin(db, provider, owner.id, input), /account changed/);
    await saveUserAccess(db, users[0], { id: target.id, expectedRole: "USER", expectedActive: false, role: "USER", active: true });
    target = await db.appUser.findUniqueOrThrow({ where: { id: target.id } });
    const order = await db.salesOrder.create({ data: { creatorId: target.id, requestKey: randomUUID(), name: "Synthetic deletion history order", assignments: { create: { userId: target.id } }, events: { create: { actorId: target.id, changes: { synthetic: true } } }, attachments: { create: { uploaderId: target.id, requestKey: randomUUID(), filename: "synthetic.pdf", contentType: "application/pdf", size: 10, stagingKey: `synthetic/${randomUUID()}`, storageKey: `synthetic/${randomUUID()}`, state: "READY", expiresAt: new Date() } } } });
    orders.push(order.id);
    const fresh = { id: target.id, expectedUpdatedAt: target.updatedAt.toISOString() };
    failure = true;
    await assert.rejects(deleteUserLogin(db, provider, owner.id, fresh), /App access is blocked/);
    const pending = await db.appUser.findUniqueOrThrow({ where: { id: target.id } });
    assert.equal(pending.active, false); assert.ok(pending.loginDeletionRequestedAt); assert.equal(pending.loginDeletedAt, null);
    await assert.rejects(saveUserAccess(db, users[0], { id: target.id, expectedRole: "USER", expectedActive: false, role: "USER", active: true }), /pending deletion/);
    assert.equal(approvedAccess({ ...pending, active: true }, { id: target.clerkUserId, primaryEmail: target.email, emailVerified: true, banned: false, locked: false }), false);
    failure = false;
    await deleteUserLogin(db, provider, owner.id, fresh);
    await deleteUserLogin(db, provider, owner.id, fresh);
    assert.equal(calls, 2);
    const deleted = await db.appUser.findUniqueOrThrow({ where: { id: target.id } });
    assert.equal(deleted.active, false); assert.ok(deleted.loginDeletedAt); assert.equal(deleted.displayName, target.displayName); assert.equal(deleted.clerkUserId, target.clerkUserId);
    await assert.rejects(saveUserAccess(db, owner.id, { id: target.id, expectedRole: "USER", expectedActive: false, role: "ADMIN", active: true }), /pending deletion or deleted/);
    const retained = await db.salesOrder.findUniqueOrThrow({ where: { id: order.id }, include: { creator: true, assignments: true, events: true, attachments: true } });
    assert.equal(retained.creator.displayName, target.displayName); assert.equal(retained.assignments.length, 1); assert.equal(retained.events.length, 1); assert.equal(retained.attachments.length, 1);
    const audit = await db.userAccessAudit.findMany({ where: { userId: target.id } });
    assert.equal(audit.filter(row => (row.changes as { action?: string }).action?.includes("permanently deleted")).length, 1);
    assert.equal(audit.filter(row => (row.changes as { action?: string }).action?.includes("unconfirmed")).length, 1);
    const ownerAfter = await db.appUser.findUniqueOrThrow({ where: { id: owner.id } });
    assert.equal(ownerAfter.updatedAt.toISOString(), owner.updatedAt.toISOString());
    console.log("Super Admin-only deletion, ordinary admin deactivation, protected owner, stale requests, failure/retry, blocked reactivation and retained records passed. Fake provider only; no real Clerk users deleted.");
  } finally {
    await db.orderAttachment.deleteMany({ where: { orderId: { in: orders } } });
    await db.orderAssignment.deleteMany({ where: { orderId: { in: orders } } });
    await db.orderEvent.deleteMany({ where: { orderId: { in: orders } } });
    await db.salesOrder.deleteMany({ where: { id: { in: orders } } });
    await db.userAccessAudit.deleteMany({ where: { userId: { in: users } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(() => { console.error("User deletion checks failed. No credentials logged."); process.exitCode = 1; });
