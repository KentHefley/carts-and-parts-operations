import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { chicagoDate } from "../lib/order-types";
import { readOrderBoard } from "../lib/order-board-store";

// Persistent, clearly labeled review fixtures. Never imports save/assignment,
// notification or email send functions. Re-running leaves existing fixtures alone.
const batch = "development-board-review-2026-10-29-v1";
const stores = ["Willow Creek Market", "Copper Lantern Foods", "Cedar Hollow Grocers", "Bluebird Corner Market", "Maple Harbor Foods", "Juniper Trail Provisions", "Silver Orchard Market", "Prairie Lantern Grocers", "Aspen Cove Pantry", "Meadowbrook Trading Post", "Sunrise Ridge Market", "Pinecrest Village Foods"];
const places = [["Willow Falls", "OK", "73001"], ["Cedar Hollow", "TX", "75001"], ["Juniper Mesa", "AZ", "85001"], ["Maple Harbor", "OH", "44001"]];
function requestKey(index: number) {
  const value = createHash("sha256").update(`${batch}:${index}`).digest("hex").slice(0, 32).split("");
  value[12] = "4"; value[16] = "a";
  const hex = value.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function dateOffset(today: string, days: number) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--apply")) throw new Error("Use no flags for preview, or --apply to create development samples.");
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  try {
    const actor = await db.appUser.findFirst({ where: { email: { equals: "kent@cartsandparts.com", mode: "insensitive" }, role: "ADMIN", active: true, loginDeletedAt: null, loginDeletionRequestedAt: null } });
    if (!actor) throw new Error("Kent's approved development admin account is required.");
    const keys = Array.from({ length: 180 }, (_, index) => requestKey(index));
    const existing = await db.salesOrder.count({ where: { creatorId: actor.id, requestKey: { in: keys } } });
    console.log(`Verified Development only. Planned samples: 120 open / 60 completed (50 Complete, 10 Voided). Existing batch records: ${existing}.`);
    if (!args.includes("--apply")) { console.log("Preview only. Add --apply to create missing samples, without updating existing records."); return; }
    const today = chicagoDate();
    const choices = await db.orderChoice.findMany({ where: { active: true, fieldKey: { in: ["division__1", "dropdown__1", "terms__1"] } }, orderBy: { position: "asc" } });
    const choice = (key: string, index: number) => {
      const values = choices.filter(value => value.fieldKey === key);
      return values.length ? values[index % values.length].label : "";
    };
    const created = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "AppUser" WHERE id = ${actor.id}::uuid FOR UPDATE`;
      const current = await tx.appUser.findUniqueOrThrow({ where: { id: actor.id } });
      if (!current.active || current.role !== "ADMIN" || current.loginDeletedAt || current.loginDeletionRequestedAt) throw new Error("Development admin access changed; samples were not created.");
      let count = 0;
      for (let index = 0; index < 180; index++) {
        if (await tx.salesOrder.findUnique({ where: { creatorId_requestKey: { creatorId: actor.id, requestKey: keys[index] } }, select: { id: true } })) continue;
        const completed = index >= 120;
        const status = completed ? index >= 170 ? "Voided" : "Complete" : ["Pending", "In Progress", "Expedite"][index % 3];
        const serial = String(index + 1).padStart(3, "0");
        const store = stores[index % stores.length];
        const [city, state, zip] = places[index % places.length];
        const phone = `202-555-01${String(index % 100).padStart(2, "0")}`;
        const closeDate = dateOffset(today, -(index % 7));
        await tx.salesOrder.create({ data: {
          creatorId: actor.id, requestKey: keys[index], name: `[TEST] ${store} #${serial}`,
          fields: {
            status, dateEntered: dateOffset(today, completed ? -14 - index % 14 : -(index % 14)),
            division__1: choice("division__1", index), dropdown__1: choice("dropdown__1", index), terms__1: choice("terms__1", index),
            start_job_date__1: dateOffset(today, completed ? -7 - index % 7 : 1 + index % 14), text_28__1: `TEST-PO-${serial}`,
            text_13__1: `[TEST] ${store} Retail LLC`, text_16__1: `${1000 + index} Sample Lane`, text_17__1: city,
            text_18__1: state, text_19__1: zip, text_15__1: "Jordan Sample", text71__1: phone,
            text_21__1: `[TEST] ${store} #${serial}`, text_22__1: `TEST-${serial}`, text_24__1: `${2000 + index} Example Avenue`,
            text_25__1: city, text_26__1: state, text_27__1: zip, text_23__1: "Casey Example", text_30__1: phone,
            text_31__1: `sample-${serial}@example.invalid`,
            text_32__1: "Fictitious development order for board testing. No real customer, work request, assignment or email.",
            ...(completed ? { text_79__1: "Sample closeout (test data)", closed_out_date4__1: closeDate, statusChangedAt: `${closeDate}T18:00:00.000Z` } : {}),
            ...(status === "Voided" ? { voidReason: "Fictitious voided order for development testing." } : {}),
          },
          items: { create: [
            { position: 0, description: "[TEST] Sample shopping cart wheel", quantity: String(5 + index % 20), unitPrice: "12.50" },
            { position: 1, description: "[TEST] Sample cleaning refill kit", quantity: String(1 + index % 5), unitPrice: "44.95" },
            { position: 2 },
          ] },
          events: { create: { actorId: actor.id, changes: { event: "Development sample order created — no assignments or email", seedBatch: batch } } },
        } });
        count++;
      }
      return count;
    }, { timeout: 120_000 });
    const samples = await db.salesOrder.findMany({ where: { creatorId: actor.id, requestKey: { in: keys } }, select: { id: true, number: true, name: true, fields: true, _count: { select: { assignments: true, emails: true, notifications: true } } } });
    assert.equal(samples.length, 180);
    assert.ok(samples.every(order => order.name?.startsWith("[TEST]") && !order._count.assignments && !order._count.emails && !order._count.notifications));
    const filters = { completed: false, name: "[TEST]", number: "", status: "" };
    for (const completed of [false, true]) {
      const first = await readOrderBoard(db, actor.id, { ...filters, completed });
      assert.equal(first.rows.length, 50); assert.ok(first.nextCursor);
      const second = await readOrderBoard(db, actor.id, { ...filters, completed }, first.nextCursor);
      assert.ok(second.rows.length > 0);
    }
    console.log(`Created ${created} development samples. Verified 180 batch records, zero assignments, zero email records and zero bell notifications. Load More has another page on both boards.`);
    console.log("Search [TEST] to find the samples. Existing company orders were not modified. Re-running this script does not duplicate or overwrite this batch.");
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Development samples could not be created or verified. Credentials were not logged; existing batch records are safe to retry."); process.exitCode = 1; });
