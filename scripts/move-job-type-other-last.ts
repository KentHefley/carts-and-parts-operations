import assert from "node:assert/strict";
import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";
import { pilotCredentials } from "./pilot-target";

// Audited settings-only update. Keep all other choices and their positions.
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith("--environment="))?.split("=")[1];
  assert.ok(environment === "development" || environment === "pilot", "Choose development or pilot explicitly.");
  assert.ok(new Set(args).size === args.length && args.every(arg => arg === `--environment=${environment}` || arg === "--apply"), "Invalid arguments.");
  const db = createDatabaseClient(environment === "pilot" ? pilotCredentials().DATABASE_URL : developmentCredentials().databaseUrl);
  try {
    const result = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-dropdown-choices'))`;
      const actor = await tx.appUser.findFirst({ where: { email: { equals: "kent@cartsandparts.com", mode: "insensitive" }, role: "ADMIN", active: true, loginDeletionRequestedAt: null, loginDeletedAt: null } });
      assert.ok(actor, "Approved Super Admin required.");
      const before = await tx.orderChoice.findMany({ orderBy: [{ fieldKey: "asc" }, { position: "asc" }, { id: "asc" }] });
      const jobs = before.filter(row => row.fieldKey === "dropdown__1");
      const other = jobs.find(row => row.normalizedLabel === "other" && row.active);
      assert.ok(other, "Expected active Other choice.");
      const changed = jobs.some(row => row.id !== other.id && row.position >= other.position);
      if (args.includes("--apply") && changed) {
        const position = Math.max(...jobs.map(row => row.position)) + 1;
        await tx.orderChoice.update({ where: { id: other.id }, data: { position, version: { increment: 1 } } });
        await tx.orderChoiceAudit.create({ data: { actorId: actor.id, choiceId: other.id, changes: { actor: actor.displayName || actor.email, fieldKey: "dropdown__1", label: other.label, action: "Moved to last", beforePosition: other.position, afterPosition: position, reason: "Kent requested Other last — November 2, 2026" } } });
      }
      const after = await tx.orderChoice.findMany({ orderBy: [{ fieldKey: "asc" }, { position: "asc" }, { id: "asc" }] });
      assert.deepEqual(after.filter(row => row.id !== other.id), before.filter(row => row.id !== other.id), "Unrelated choice settings changed.");
      const choices = after.filter(row => row.fieldKey === "dropdown__1" && row.active).map(row => row.label);
      if (args.includes("--apply")) assert.equal(choices.at(-1), other.label);
      return { environment, applied: args.includes("--apply"), changed, choices };
    }, { maxWait: 10_000, timeout: 30_000 });
    console.log(JSON.stringify(result));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Other choice reorder failed or target refused; credentials withheld."); process.exitCode = 1; });
