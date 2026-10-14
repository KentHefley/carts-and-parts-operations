import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";
import { saveUserAccess } from "../lib/user-management";

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const ids: string[] = [];
  try {
    for (const role of ["ADMIN", "USER", "USER"] as const) ids.push((await db.appUser.create({ data: { clerkUserId: `access-test-${randomUUID()}`, email: `access-${randomUUID()}@example.invalid`, role } })).id);
    const owner = await db.appUser.findUniqueOrThrow({ where: { email: "kent@cartsandparts.com" } });
    assert.equal(owner.active, true); assert.equal(owner.role, "ADMIN");
    for (const change of [{ role: "USER" as const, active: true }, { role: "ADMIN" as const, active: false }]) {
      await assert.rejects(saveUserAccess(db, ids[0], { id: owner.id, expectedRole: "ADMIN", expectedActive: true, ...change }), /protected Super Admin/);
    }
    const ownerAfter = await db.appUser.findUniqueOrThrow({ where: { id: owner.id } });
    assert.equal(ownerAfter.role, owner.role); assert.equal(ownerAfter.active, owner.active); assert.equal(ownerAfter.updatedAt.toISOString(), owner.updatedAt.toISOString());
    const edit = { id: ids[2], expectedRole: "USER" as const, expectedActive: true, role: "ADMIN" as const, active: true };
    await assert.rejects(saveUserAccess(db, ids[1], edit), /Administrator/);
    await saveUserAccess(db, ids[0], edit);
    await saveUserAccess(db, ids[0], edit);
    assert.equal(await db.userAccessAudit.count({ where: { userId: ids[2] } }), 1);
    await assert.rejects(saveUserAccess(db, ids[0], { ...edit, role: "USER", active: false }), /changed/);
    await saveUserAccess(db, ids[0], { ...edit, expectedRole: "ADMIN", active: false });
    await assert.rejects(saveUserAccess(db, ids[2], { ...edit, id: ids[1] }), /Administrator/);
    assert.equal((await db.appUser.findUniqueOrThrow({ where: { id: ids[2] } })).clerkUserId.startsWith("access-test-"), true);
    await saveUserAccess(db, ids[0], { ...edit, expectedRole: "ADMIN", expectedActive: false });
    assert.equal(await db.userAccessAudit.count({ where: { userId: ids[2] } }), 3);
    console.log("User access permission, stale edit, retry, deactivate/reactivate and audit checks passed.");
  } finally {
    await db.userAccessAudit.deleteMany({ where: { userId: { in: ids } } });
    await db.appUser.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
}
main().catch(() => { console.error("User management checks failed. No credentials logged."); process.exitCode = 1; });
