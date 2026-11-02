import assert from "node:assert/strict";
import { createDatabaseClient } from "../lib/database-client";
import { lockFields, readFieldLayout, writeLayout } from "../lib/custom-field-store";
import { revisedServiceLayout } from "../lib/service-layout";
import { developmentCredentials } from "./development-target";
import { pilotCredentials } from "./pilot-target";

async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith("--environment="))?.split("=")[1];
  assert.ok(environment === "development" || environment === "pilot", "Choose development or pilot explicitly.");
  assert.ok(new Set(args).size === args.length && args.every(arg => arg === `--environment=${environment}` || arg === "--apply"), "Invalid arguments.");
  const db = createDatabaseClient(environment === "pilot" ? pilotCredentials().DATABASE_URL : developmentCredentials().databaseUrl);
  try {
    const current = await readFieldLayout(db);
    const fields = revisedServiceLayout(current.fields);
    const changed = JSON.stringify(fields) !== JSON.stringify(current.fields);
    const targets = new Set(["numbers__1", "text_32__1", "text14__1"]);
    assert.deepEqual(fields.filter(field => !targets.has(field.key)), current.fields.filter(field => !targets.has(field.key)), "Unrelated fields changed.");
    assert.equal(fields.length, current.fields.length);
    if (args.includes("--apply") && changed) await db.$transaction(async tx => {
      await lockFields(tx);
      const actor = await tx.appUser.findFirst({ where: { email: { equals: "kent@cartsandparts.com", mode: "insensitive" }, role: "ADMIN", active: true, loginDeletionRequestedAt: null, loginDeletedAt: null } });
      assert.ok(actor, "Approved Super Admin required.");
      const latest = await readFieldLayout(tx);
      assert.equal(latest.version, current.version, "Layout changed; review before retrying.");
      // Only settings and their audit record change. Historical order values,
      // item records and previously queued email payloads are never rewritten.
      await writeLayout(tx, { ...latest, fields });
      await tx.orderFieldAudit.create({ data: { actorId: actor.id, changes: { actor: actor.displayName || actor.email, action: "Updated Service and Labor layout", retiredFields: ["text_32__1", "text14__1"], movedField: "numbers__1", section: "Items and Pricing", afterField: "text0__1", preservedOrderValues: true } } });
    }, { timeout: 30_000 });
    if (args.includes("--apply")) assert.deepEqual((await readFieldLayout(db)).fields, fields);
    console.log(JSON.stringify({ environment, applied: args.includes("--apply"), changed, removedControls: fields.filter(field => ["text_32__1", "text14__1"].includes(field.key)).map(({ key, active }) => ({ key, active })), itemsAndPricing: fields.filter(field => field.section === "Items and Pricing" && field.active && !field.deleted).map(field => field.label), orderValuesUntouched: true }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Service layout update refused or failed. Review target/settings before retrying; credentials withheld."); process.exitCode = 1; });
