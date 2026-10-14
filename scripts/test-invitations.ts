import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";
import { sendEmployeeInvitation, manageEmployeeInvitation, acceptEmployeeInvitation, type InvitationProvider, type RemoteInvitation } from "../lib/invitation-store";

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const users: string[] = [], requests: string[] = [];
  let sends = 0, revokes = 0, fail = false, exists = false;
  const remote = new Map<string, RemoteInvitation>();
  const provider: InvitationProvider = {
    create: async (email, id) => {
      sends++;
      const result = { id: `synthetic-${id}`, emailAddress: email, status: "pending", publicMetadata: { operationsInvitationId: id } };
      remote.set(id, result);
      if (fail) throw new Error("Synthetic timeout after provider acceptance");
      return result;
    },
    find: async (_email, id) => remote.get(id) || null,
    revoke: async id => { revokes++; for (const row of remote.values()) if (row.id === id) row.status = "revoked"; },
    accountExists: async () => exists,
  };
  const request = () => { const id = randomUUID(); requests.push(id); return { id, email: `invite-${id}@example.invalid` }; };
  try {
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `invitation-test-${randomUUID()}`, email: `invite-actor-${randomUUID()}@example.invalid`, role } })).id);
    const first = request();
    await assert.rejects(sendEmployeeInvitation(db, provider, users[1], first, [first.email]), /Administrator/);
    await assert.rejects(sendEmployeeInvitation(db, provider, users[0], first, []), /allowlist/);
    await sendEmployeeInvitation(db, provider, users[0], first, [first.email]);
    await sendEmployeeInvitation(db, provider, users[0], first, [first.email]);
    assert.equal(sends, 1);
    const parallel = request(), parallelOther = request();
    const parallelResults = await Promise.allSettled([parallel, { ...parallelOther, email: parallel.email }].map(input => sendEmployeeInvitation(db, provider, users[0], input, [parallel.email])));
    assert.equal(parallelResults.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(sends, 2);
    const duplicate = request();
    await assert.rejects(sendEmployeeInvitation(db, provider, users[0], { ...duplicate, email: first.email }, [first.email]), /already exists/);
    const identity = { id: `synthetic-invited-${randomUUID()}`, email: first.email, verified: true, banned: false, locked: false, invitationId: first.id, name: "Synthetic Invited Employee" };
    assert.equal(await acceptEmployeeInvitation(db, { ...identity, verified: false }), null);
    assert.equal(await acceptEmployeeInvitation(db, { ...identity, banned: true }), null);
    assert.equal(await acceptEmployeeInvitation(db, { ...identity, email: "wrong@example.invalid" }), null);
    const joined = await acceptEmployeeInvitation(db, identity);
    assert.ok(joined); users.push(joined.id); assert.equal(joined.role, "USER"); assert.equal(joined.displayName, identity.name);
    assert.equal((await acceptEmployeeInvitation(db, identity))?.id, joined.id);
    assert.equal(await db.invitationAudit.count({ where: { invitationId: first.id, action: "Accepted and provisioned User access" } }), 1);
    await db.appUser.update({ where: { id: joined.id }, data: { active: false } });
    assert.equal((await acceptEmployeeInvitation(db, identity))?.active, false);
    const cancelled = request();
    await sendEmployeeInvitation(db, provider, users[0], cancelled, [cancelled.email]);
    await assert.rejects(manageEmployeeInvitation(db, provider, users[1], cancelled.id, true), /Administrator/);
    await manageEmployeeInvitation(db, provider, users[0], cancelled.id, true);
    assert.equal(revokes, 1);
    assert.equal(await acceptEmployeeInvitation(db, { ...identity, id: "synthetic-cancelled", email: cancelled.email, invitationId: cancelled.id }), null);
    const failedCleanup = request();
    await sendEmployeeInvitation(db, provider, users[0], failedCleanup, [failedCleanup.email]);
    await assert.rejects(manageEmployeeInvitation(db, { ...provider, revoke: async () => { throw new Error("Synthetic revoke failure"); } }, users[0], failedCleanup.id, true), /App approval is cancelled/);
    assert.equal(await acceptEmployeeInvitation(db, { ...identity, id: "synthetic-failed-cleanup", email: failedCleanup.email, invitationId: failedCleanup.id }), null);
    const expired = request();
    await sendEmployeeInvitation(db, provider, users[0], expired, [expired.email]);
    await db.employeeInvitation.update({ where: { id: expired.id }, data: { expiresAt: new Date(0) } });
    assert.equal(await acceptEmployeeInvitation(db, { ...identity, id: "synthetic-expired", email: expired.email, invitationId: expired.id }), null);
    const uncertain = request(); fail = true;
    await assert.rejects(sendEmployeeInvitation(db, provider, users[0], uncertain, [uncertain.email]), /could not be confirmed/);
    const countBefore = sends;
    await sendEmployeeInvitation(db, provider, users[0], uncertain, [uncertain.email]);
    assert.equal(sends, countBefore);
    await manageEmployeeInvitation(db, provider, users[0], uncertain.id, false);
    assert.equal((await db.employeeInvitation.findUniqueOrThrow({ where: { id: uncertain.id } })).state, "SENT");
    fail = false; exists = true; const existing = request();
    await assert.rejects(sendEmployeeInvitation(db, provider, users[0], existing, [existing.email]), /already has a Clerk/);
    assert.equal(sends, countBefore);
    await db.appUser.update({ where: { id: users[0] }, data: { active: false } });
    const blocked = request();
    await assert.rejects(sendEmployeeInvitation(db, provider, users[0], blocked, [blocked.email]), /Administrator/);
    console.log("Invitation permissions, duplicate suppression, cancellation, expiry, uncertain recovery and verified provisioning passed. Fake provider only; no emails sent.");
  } finally {
    await db.invitationAudit.deleteMany({ where: { invitationId: { in: requests } } });
    await db.employeeInvitation.deleteMany({ where: { id: { in: requests } } });
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(() => { console.error("Invitation checks failed. No credentials logged."); process.exitCode = 1; });
