import assert from "node:assert/strict";
import { createDatabaseClient } from "../lib/database-client";
import { choiceOptions, normalizeChoice } from "../lib/order-choice-policy";
import { readOrderChoices } from "../lib/order-choice-store";
import { developmentCredentials } from "./development-target";
import { pilotCredentials } from "./pilot-target";

// Explicit administrative data update, not a schema migration. Default is review only.
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith("--environment="))?.split("=")[1];
  assert.ok(environment === "development" || environment === "pilot", "Choose an explicit development or pilot environment.");
  assert.ok(args.every(arg => arg === `--environment=${environment}` || arg === "--apply") && new Set(args).size === args.length, "Invalid arguments.");
  const db = createDatabaseClient(environment === "pilot" ? pilotCredentials().DATABASE_URL : developmentCredentials().databaseUrl);
  try {
    const result = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('order-dropdown-choices'))`;
      const actor = await tx.appUser.findFirst({ where: { email: { equals: "kent@cartsandparts.com", mode: "insensitive" }, role: "ADMIN", active: true, loginDeletionRequestedAt: null, loginDeletedAt: null } });
      assert.ok(actor, "Kent's approved administrator account is required.");
      const rows = await tx.orderChoice.findMany({ where: { fieldKey: "freight__1" } });
      const excluded = new Set(["na", "freight collect"]);
      const desired = rows.filter(row => row.active && !excluded.has(row.normalizedLabel)).map(row => row.label);
      if (!desired.some(label => normalizeChoice(label) === "in-house delivery")) desired.push("In-House Delivery");
      desired.sort((a, b) => a.localeCompare(b, "en-US", { sensitivity: "base", numeric: true }));
      if (!args.includes("--apply")) return { environment, applied: false, choices: desired };
      const audit = async (id: string, label: string, action: string, extra = {}) => tx.orderChoiceAudit.create({ data: { actorId: actor.id, choiceId: id, changes: { actor: actor.displayName || actor.email, fieldKey: "freight__1", label, action, ...extra } } });
      for (const row of rows.filter(row => row.active && excluded.has(row.normalizedLabel))) {
        await tx.orderChoice.update({ where: { id: row.id }, data: { active: false, version: { increment: 1 } } });
        await audit(row.id, row.label, "Deactivated");
      }
      for (const [position, label] of desired.entries()) {
        const row = rows.find(row => row.normalizedLabel === normalizeChoice(label));
        if (!row) {
          const created = await tx.orderChoice.create({ data: { fieldKey: "freight__1", label, normalizedLabel: normalizeChoice(label), position } });
          await audit(created.id, label, "Added");
        } else if (!row.active || row.position !== position) {
          await tx.orderChoice.update({ where: { id: row.id }, data: { active: true, position, version: { increment: 1 } } });
          await audit(row.id, row.label, row.active ? "Alphabetized" : "Reactivated", { beforePosition: row.position, afterPosition: position });
        }
      }
      return { environment, applied: true, choices: desired };
    }, { maxWait: 10_000, timeout: 30_000 });
    const storedChoices = choiceOptions(await readOrderChoices(db)).freight__1;
    if (result.applied) assert.deepEqual(storedChoices, result.choices, "Saved choice order does not match.");
    console.log(JSON.stringify({ ...result, storedChoices }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Freight choices update failed; credentials withheld. Review settings before retrying."); process.exitCode = 1; });
