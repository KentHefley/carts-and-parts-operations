import assert from "node:assert/strict";
import test from "node:test";
import { type PrismaClient } from "../generated/prisma/client";
import { saveUserAccess } from "../lib/user-management";
import { isSuperAdminAccount } from "../lib/super-admin-policy";

test("Super Admin protection rejects direct demotion/deactivation by another admin and self", async () => {
  const ownerId = "33333333-3333-4333-8333-333333333333", actorId = "44444444-4444-4444-8444-444444444444";
  let writes = 0;
  const owner = { id: ownerId, email: "kent@cartsandparts.com", active: true, role: "ADMIN" };
  const actor = { id: actorId, email: "another@example.invalid", active: true, role: "ADMIN" };
  const tx = { $executeRaw: async () => 0, appUser: {
    findUnique: async ({ where }: { where: { id: string } }) => where.id === ownerId ? owner : actor,
    update: async () => { writes++; },
    count: async () => 2,
  }, userAccessAudit: { create: async () => { writes++; } } };
  const db = { $transaction: (operation: (value: typeof tx) => Promise<void>) => operation(tx) } as unknown as PrismaClient;
  for (const by of [actorId, ownerId]) {
    for (const change of [{ role: "USER" as const, active: true }, { role: "ADMIN" as const, active: false }]) {
      await assert.rejects(saveUserAccess(db, by, { id: ownerId, expectedRole: "ADMIN", expectedActive: true, ...change }), /protected Super Admin/);
    }
  }
  await saveUserAccess(db, actorId, { id: ownerId, expectedRole: "ADMIN", expectedActive: true, role: "ADMIN", active: true });
  assert.equal(writes, 0);
  assert.equal(isSuperAdminAccount("Kent@CartsAndParts.com"), true);
  assert.equal(isSuperAdminAccount("kent@cartsandparts.com.example.invalid"), false);
  assert.equal(isSuperAdminAccount("another@example.invalid"), false);
});

test("serialized competing demotions preserve the last active admin", async () => {
  const first = "11111111-1111-4111-8111-111111111111", second = "22222222-2222-4222-8222-222222222222";
  const rows = new Map([first, second].map(id => [id, { id, role: "ADMIN", active: true, email: `${id}@example.invalid`, displayName: null }]));
  let tail = Promise.resolve();
  let audits = 0;
  const tx = {
    $executeRaw: async () => 0,
    appUser: {
      findUnique: async ({ where }: { where: { id: string } }) => rows.get(where.id),
      count: async () => [...rows.values()].filter(row => row.active && row.role === "ADMIN").length,
      update: async ({ where, data }: { where: { id: string }; data: { role: string; active: boolean } }) => Object.assign(rows.get(where.id)!, data),
    },
    userAccessAudit: { create: async () => { audits++; } },
  };
  const db = { $transaction: (operation: (value: typeof tx) => Promise<void>) => {
    const result = tail.then(() => operation(tx)); tail = result.catch(() => {}); return result;
  } } as unknown as PrismaClient;
  const results = await Promise.allSettled([first, second].map(id => saveUserAccess(db, id, { id, role: "USER", active: true, expectedRole: "ADMIN", expectedActive: true })));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const failure = results.find(result => result.status === "rejected") as PromiseRejectedResult;
  assert.match(failure.reason.message, /at least one active administrator/);
  assert.equal(audits, 1);
  const last = [...rows.values()].find(row => row.role === "ADMIN")!;
  await assert.rejects(saveUserAccess(db, last.id, { id: last.id, role: "ADMIN", active: false, expectedRole: "ADMIN", expectedActive: true }), /at least one active administrator/);
});
