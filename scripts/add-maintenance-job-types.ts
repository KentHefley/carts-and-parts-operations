import assert from "node:assert/strict";
import { createDatabaseClient } from "../lib/database-client";
import { normalizeChoice, choiceOptions } from "../lib/order-choice-policy";
import { readOrderChoices } from "../lib/order-choice-store";
import { developmentCredentials } from "./development-target";
import { pilotCredentials } from "./pilot-target";

// Explicit, repeatable settings update. No schema/order changes or sends.
const labels = ["Maintenance", "Maintenance CM"];
const fieldKey = "dropdown__1";
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith("--environment="))?.split("=")[1];
  assert.ok(environment === "development" || environment === "pilot", "Choose development or pilot explicitly.");
  assert.ok(new Set(args).size === args.length && args.every(arg => arg === `--environment=${environment}` || arg === "--apply"), "Invalid arguments.");
  const apply = args.includes("--apply");
  const db = createDatabaseClient(environment === "pilot" ? pilotCredentials().DATABASE_URL : developmentCredentials().databaseUrl);
  try {
    const result = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-dropdown-choices'))`;
      const actor = await tx.appUser.findFirst({ where: { email: { equals: "kent@cartsandparts.com", mode: "insensitive" }, role: "ADMIN", active: true, loginDeletionRequestedAt: null, loginDeletedAt: null } });
      assert.ok(actor, "Approved Super Admin required.");
      const before = await tx.orderChoice.findMany({ orderBy: [{ fieldKey: "asc" }, { position: "asc" }, { id: "asc" }] });
      const rows = before.filter(row => row.fieldKey === fieldKey);
      let position = Math.max(-1, ...rows.map(row => row.position)) + 1;
      const changes: { label: string; action: string }[] = [];
      for (const label of labels) {
        const normalizedLabel = normalizeChoice(label);
        const existing = rows.find(row => row.normalizedLabel === normalizedLabel);
        if (existing?.active) continue;
        changes.push({ label, action: existing ? "Reactivated" : "Added" });
        if (!apply) continue;
        const choice = existing
          ? await tx.orderChoice.update({ where: { id: existing.id }, data: { active: true, version: { increment: 1 } } })
          : await tx.orderChoice.create({ data: { fieldKey, label, normalizedLabel, position: position++ } });
        await tx.orderChoiceAudit.create({ data: { actorId: actor.id, choiceId: choice.id, changes: { actor: actor.displayName || actor.email, fieldKey, label: choice.label, action: existing ? "Reactivated" : "Added", reason: "Kent requested Maintenance job types — November 2, 2026" } } });
      }
      if (apply) {
        const after = await tx.orderChoice.findMany({ orderBy: [{ fieldKey: "asc" }, { position: "asc" }, { id: "asc" }] });
        const requested = new Set(labels.map(normalizeChoice));
        assert.deepEqual(after.filter(row => row.fieldKey !== fieldKey || !requested.has(row.normalizedLabel)), before.filter(row => row.fieldKey !== fieldKey || !requested.has(row.normalizedLabel)), "Unrelated choice settings changed.");
        for (const label of labels) assert.equal(after.filter(row => row.fieldKey === fieldKey && row.normalizedLabel === normalizeChoice(label) && row.active).length, 1);
      }
      return { environment, applied: apply, changes };
    }, { maxWait: 10_000, timeout: 30_000 });
    const storedChoices = choiceOptions(await readOrderChoices(db))[fieldKey];
    if (apply) for (const label of labels) assert.ok(storedChoices.some(stored => normalizeChoice(stored) === normalizeChoice(label)));
    console.log(JSON.stringify({ ...result, storedChoices, orderValuesUntouched: true }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Maintenance choices update failed; credentials withheld. Review before retrying."); process.exitCode = 1; });
