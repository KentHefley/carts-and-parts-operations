import assert from "node:assert/strict";
import { createDatabaseClient } from "../lib/database-client";
import { lockFields, readFieldLayout, writeLayout } from "../lib/custom-field-store";
import { developmentCredentials } from "./development-target";
import { pilotCredentials } from "./pilot-target";

// Explicit settings update; never rewrites order values or silently targets pilot.
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith("--environment="))?.split("=")[1];
  assert.ok(environment === "development" || environment === "pilot", "Choose development or pilot explicitly.");
  assert.ok(args.every(arg => arg === `--environment=${environment}` || arg === "--apply") && new Set(args).size === args.length, "Invalid arguments.");
  const db = createDatabaseClient(environment === "pilot" ? pilotCredentials().DATABASE_URL : developmentCredentials().databaseUrl);
  try {
    const actor = await db.appUser.findFirstOrThrow({ where: { email: "kent@cartsandparts.com", role: "ADMIN", active: true, loginDeletionRequestedAt: null, loginDeletedAt: null } });
    const current = await readFieldLayout(db);
    const freight = current.fields.find(field => field.key === "text772__1");
    assert.ok(freight && !freight.deleted && !freight.custom && freight.type === "text", "Expected existing Freight text field.");
    const fields = current.fields.filter(field => field.key !== freight.key);
    const anchor = fields.findIndex(field => field.key === "text5__1" && !field.deleted);
    assert.ok(anchor >= 0 && fields[anchor].section === "Service and Labor", "Expected In House Refurbs in Service and Labor.");
    fields.splice(anchor + 1, 0, { ...freight, section: "Service and Labor" });
    const changed = JSON.stringify(fields) !== JSON.stringify(current.fields);
    if (args.includes("--apply") && changed) await db.$transaction(async tx => {
      await lockFields(tx);
      const approved = await tx.appUser.findFirst({ where: { id: actor.id, email: "kent@cartsandparts.com", role: "ADMIN", active: true, loginDeletionRequestedAt: null, loginDeletedAt: null } });
      assert.ok(approved, "Approved Super Admin required.");
      const latest = await readFieldLayout(tx);
      assert.equal(latest.version, current.version, "Layout changed; review before retrying.");
      const moved = fields.map(field => field.key === freight.key ? { ...field, revision: field.revision + 1 } : field);
      // Core sections remain protected in ordinary settings. This narrowly scoped,
      // reviewed maintenance operation changes only Freight placement.
      await writeLayout(tx, { ...current, fields: moved });
      await tx.orderFieldAudit.create({ data: { actorId: actor.id, changes: { actor: approved.displayName || approved.email, action: "Moved Freight field", label: freight.label, key: freight.key, beforeSection: freight.section, afterSection: "Service and Labor", afterField: "text5__1" } } });
    });
    const saved = await readFieldLayout(db);
    if (args.includes("--apply")) {
      const index = saved.fields.findIndex(field => field.key === freight.key);
      assert.equal(saved.fields[index].section, "Service and Labor");
      assert.equal(saved.fields[index - 1].key, "text5__1");
      assert.equal(saved.fields.length, current.fields.length);
      assert.deepEqual(saved.fields.filter(field => field.key !== freight.key), current.fields.filter(field => field.key !== freight.key));
      for (const key of ["key", "label", "type", "active", "help", "options"] as const) assert.deepEqual(saved.fields[index][key], freight[key]);
    }
    console.log(JSON.stringify({ environment, applied: args.includes("--apply"), changed, key: freight.key, from: freight.section, to: "Service and Labor", after: "In House Refurbs", orderValuesUntouched: true }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Freight layout update failed; credentials withheld. Review settings before retrying."); process.exitCode = 1; });
