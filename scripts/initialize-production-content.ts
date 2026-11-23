import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "../generated/prisma/client";
import { createDatabaseClient } from "../lib/database-client";
import { readFieldLayout } from "../lib/custom-field-store";
import { attachmentStorage } from "../lib/attachment-storage";
import { beginPriceBook, finishPriceBook } from "../lib/price-book-store";
import { pilotCredentials } from "./pilot-target";
import { productionCredentials } from "./production-target";

const digest = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const action = "Initialized production settings from Pilot";

async function main() {
  const target = productionCredentials();
  const source = pilotCredentials();
  const production = createDatabaseClient(target.DATABASE_URL);
  const pilot = createDatabaseClient(source.DATABASE_URL);
  const sourceStorage = new S3Client({ region: "auto", endpoint: `https://${source.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: source.R2_ACCESS_KEY_ID, secretAccessKey: source.R2_SECRET_ACCESS_KEY }, maxAttempts: 2 });
  try {
    const snapshot = await pilot.$transaction(async tx => ({
      choices: await tx.orderChoice.findMany({ orderBy: [{ fieldKey: "asc" }, { position: "asc" }, { id: "asc" }] }),
      layout: await readFieldLayout(tx),
      people: await tx.calendarPerson.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, color: true, active: true, revision: true } }),
      categories: await tx.calendarCategory.findMany({ orderBy: { id: "asc" } }),
      books: await tx.priceBook.findMany({ orderBy: { key: "asc" } }),
    }), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    const settings = { choices: snapshot.choices, layout: snapshot.layout.fields, people: snapshot.people, categories: snapshot.categories };
    const settingsHash = digest(JSON.stringify(settings));
    const actor = await production.appUser.findUniqueOrThrow({ where: { email: "kent@cartsandparts.com" } });
    assert.ok(actor.active && actor.role === "ADMIN" && !actor.loginDeletionRequestedAt && !actor.loginDeletedAt);
    assert.equal(snapshot.books.filter(book => book.currentFileId).length, 3, "Pilot needs three current books.");
    console.log(JSON.stringify({ apply: process.argv.includes("--apply"), choices: settings.choices.length,
      fields: settings.layout.length, calendarPeople: settings.people.length, categories: settings.categories.length, books: 3, settingsHash }));
    if (!process.argv.includes("--apply")) return;
    writeFileSync("tmp/production-content-source.json", JSON.stringify(snapshot, null, 2));
    await production.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('production-content-initialization'))`;
      assert.equal(await tx.salesOrder.count(), 0, "Initial content setup requires no sales orders.");
      assert.equal(await tx.calendarEntry.count(), 0, "Initial calendars must stay empty.");
      const initialized = await tx.orderFieldAudit.findFirst({ where: { changes: { path: ["action"], equals: action } } });
      if (initialized) {
        assert.equal((initialized.changes as Record<string, unknown>).settingsHash, settingsHash, "Source settings changed after initialization; review explicitly.");
        return;
      }
      assert.equal(await tx.orderFieldLayout.count(), 0);
      assert.equal(await tx.orderChoiceAudit.count(), 0);
      await tx.orderChoice.deleteMany();
      await tx.orderChoice.createMany({ data: settings.choices });
      await tx.orderFieldLayout.create({ data: { id: "orders", version: 1, definitions: settings.layout as unknown as Prisma.InputJsonValue } });
      await tx.calendarPerson.deleteMany();
      await tx.calendarCategory.deleteMany();
      if (settings.people.length) await tx.calendarPerson.createMany({ data: settings.people });
      if (settings.categories.length) await tx.calendarCategory.createMany({ data: settings.categories });
      await tx.orderFieldAudit.create({ data: { actorId: actor.id, changes: { action, settingsHash, source: "pilot", choices: settings.choices.length, fields: settings.layout.length, people: settings.people.length, categories: settings.categories.length } } });
    }, { timeout: 30_000 });
    Object.assign(process.env, target);
    const storage = attachmentStorage();
    for (const book of snapshot.books) {
      const file = await pilot.priceBookFile.findUniqueOrThrow({ where: { id: book.currentFileId! } });
      assert.equal(file.state, "READY");
      const original = await sourceStorage.send(new GetObjectCommand({ Bucket: source.R2_BUCKET_NAME, Key: file.storageKey }), { abortSignal: AbortSignal.timeout(30000) });
      const bytes = await original.Body!.transformToByteArray();
      assert.equal(bytes.length, file.size);
      const hash = digest(bytes);
      const existing = await production.priceBook.findUnique({ where: { key: book.key } });
      if (existing?.currentFileId) {
        const current = await production.priceBookFile.findUniqueOrThrow({ where: { id: existing.currentFileId } });
        const content = await storage.read(current.storageKey);
        assert.equal(digest(await content.Body!.transformToByteArray()), hash, "Existing production book differs; review before replacement.");
        assert.equal(existing.edition, book.edition);
        console.log(`${book.key}: original bytes already verified`);
        continue;
      }
      const upload = await beginPriceBook(production, storage, actor.id, { key: book.key, revision: existing?.revision ?? 0,
        edition: book.edition, filename: file.filename, size: bytes.length, requestKey: randomUUID() });
      const response = await fetch(upload.url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: new Uint8Array(bytes), signal: AbortSignal.timeout(60000) });
      assert.ok(response.ok, "Production upload failed.");
      await finishPriceBook(production, storage, actor.id, upload.id);
      const published = await production.priceBookFile.findUniqueOrThrow({ where: { id: upload.id } });
      const content = await storage.read(published.storageKey);
      assert.equal(digest(await content.Body!.transformToByteArray()), hash);
      assert.equal(published.pages, file.pages);
      console.log(`${book.key}: copied and original bytes verified`);
    }
    assert.equal(await production.salesOrder.count(), 0);
    assert.equal(await production.calendarEntry.count(), 0);
    console.log("Production settings and three price books initialized; orders and calendar entries are empty.");
  } finally { await pilot.$disconnect(); await production.$disconnect(); sourceStorage.destroy(); }
}
main().catch(() => { console.error("Production content initialization stopped. Credentials withheld; completed book transfers are safe to retry."); process.exitCode = 1; });
