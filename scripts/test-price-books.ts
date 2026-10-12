import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { beginPriceBook, finishPriceBook, changeEdition, validatePriceBook, cleanupPriceBooks } from "../lib/price-book-store";
import { attachmentStorage, type AttachmentStorage } from "../lib/attachment-storage";
import { bookKeys } from "../lib/price-book-types";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  const users: string[] = [];
  let ownedKey: string | undefined;
  const memory = new Map<string, Uint8Array>();
  let failCleanup = false;
  const real = process.argv.includes("--r2");
  const storage = real ? attachmentStorage() : {
    upload: async (key: string) => key,
    inspect: async (key: string) => ({ size: memory.get(key)!.length, type: "application/pdf", etag: "fixture" }),
    read: async (key: string) => ({ Body: { transformToByteArray: async () => memory.get(key)! } }),
    promote: async (from: string, to: string) => { memory.set(to, memory.get(from)!); },
    remove: async (key: string) => { if (failCleanup) throw new Error("Synthetic failure"); memory.delete(key); },
  } as unknown as AttachmentStorage;
  try {
    const existing = await db.priceBook.findMany({ select: { key: true } });
    if (existing.length) throw new Error("Price books are already configured; run lifecycle tests in an isolated development database.");
    const availableKey = bookKeys[0];
    // Claim the unused slot; never replace an existing book, including an empty configured one.
    await db.priceBook.create({ data: { key: availableKey } });
    ownedKey = availableKey;
    for (const role of ["ADMIN", "USER"] as const) users.push((await db.appUser.create({ data: { clerkUserId: `books-test-${randomUUID()}`, email: `books-${randomUUID()}@example.invalid`, role } })).id);
    const pdf = await PDFDocument.create(); pdf.addPage().drawText("Synthetic price book verification"); pdf.addPage();
    const bytes = await pdf.save();
    assert.equal(await validatePriceBook(bytes), 2);
    await assert.rejects(validatePriceBook(new TextEncoder().encode("not a PDF")));
    const input = { key: ownedKey, revision: 0, edition: "2026-10", filename: "synthetic.pdf", size: bytes.length, requestKey: randomUUID() };
    await assert.rejects(beginPriceBook(db, storage, users[1], input));
    const first = await beginPriceBook(db, storage, users[0], input);
    assert.equal((await beginPriceBook(db, storage, users[0], input)).id, first.id);
    async function upload(id: string, url: string, payload: Uint8Array) {
      if (real) { const result = await fetch(url, { method: "PUT", headers: { "content-type": "application/pdf" }, body: Buffer.from(payload) }); assert.ok(result.ok); }
      else memory.set((await db.priceBookFile.findUniqueOrThrow({ where: { id } })).stagingKey, payload);
    }
    await upload(first.id, first.url, bytes);
    await finishPriceBook(db, storage, users[0], first.id);
    await finishPriceBook(db, storage, users[0], first.id);
    assert.equal(await db.priceBookEvent.count({ where: { bookKey: ownedKey } }), 1);
    const published = await db.priceBookFile.findUniqueOrThrow({ where: { id: first.id } });
    assert.equal(published.pages, 2);
    assert.deepEqual(await (await storage.read(published.storageKey)).Body!.transformToByteArray(), bytes);
    await assert.rejects(changeEdition(db, users[1], ownedKey, 1, "2026-11"));
    await changeEdition(db, users[0], ownedKey, 1, "2026-11");
    await assert.rejects(changeEdition(db, users[0], ownedKey, 1, "2026-12"));
    const bad = await beginPriceBook(db, storage, users[0], { ...input, revision: 2, requestKey: randomUUID() });
    await upload(bad.id, bad.url, new Uint8Array(bytes.length).fill(65));
    await assert.rejects(finishPriceBook(db, storage, users[0], bad.id));
    assert.equal((await db.priceBook.findUniqueOrThrow({ where: { key: ownedKey } })).currentFileId, first.id);
    const second = await beginPriceBook(db, storage, users[0], { ...input, revision: 2, requestKey: randomUUID() });
    await upload(second.id, second.url, bytes);
    failCleanup = true;
    await finishPriceBook(db, storage, users[0], second.id);
    failCleanup = false;
    await db.priceBookFile.updateMany({ where: { bookKey: ownedKey }, data: { expiresAt: new Date(0) } });
    await cleanupPriceBooks(db, storage);
    assert.ok((await db.priceBookFile.findUniqueOrThrow({ where: { id: first.id } })).objectCleanedAt);
    assert.equal((await db.priceBook.findUniqueOrThrow({ where: { key: ownedKey } })).currentFileId, second.id);
    console.log(`PASS: ${real ? "private R2" : "simulated storage"} PDF publication, original bytes, duplicate retry, permissions, stale edition, invalid replacement protection and cleanup.`);
  } finally {
    if (ownedKey && users.length) {
      const files = await db.priceBookFile.findMany({ where: { bookKey: ownedKey, uploaderId: { in: users } } });
      for (const file of files) { await storage.remove(file.stagingKey); await storage.remove(file.storageKey); }
      await db.priceBookEvent.deleteMany({ where: { bookKey: ownedKey, actorId: { in: users } } });
      await db.priceBookFile.deleteMany({ where: { id: { in: files.map(file => file.id) } } });
      await db.priceBook.delete({ where: { key: ownedKey } });
    }
    await db.appUser.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Price book verification failed"); process.exitCode = 1; });
