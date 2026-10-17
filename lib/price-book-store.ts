import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import type { AttachmentStorage } from "./attachment-storage";
import { bookKeys, isBookKey, priceBookLimit, validEdition, type BookView } from "./price-book-types";
import { validAttachmentId } from "./attachment-policy";
import { applicationMode } from "./environment-policy";

async function admin(tx: Prisma.TransactionClient, actorId: string) {
  const actor = await tx.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.role !== "ADMIN") throw new Error("Administrator access required.");
}
async function lock(tx: Prisma.TransactionClient, key: string) {
  if (!isBookKey(key)) throw new Error("Invalid price book.");
  await tx.priceBook.upsert({ where: { key }, create: { key }, update: {} });
  await tx.$queryRaw`SELECT key FROM "PriceBook" WHERE key = ${key} FOR UPDATE`;
  return tx.priceBook.findUniqueOrThrow({ where: { key } });
}
export async function listPriceBooks(db: PrismaClient): Promise<BookView[]> {
  const books = await db.priceBook.findMany();
  const files = await db.priceBookFile.findMany({ where: { id: { in: books.flatMap(book => book.currentFileId ? [book.currentFileId] : []) }, state: "READY" } });
  return bookKeys.map(key => {
    const book = books.find(book => book.key === key);
    const file = files.find(file => file.id === book?.currentFileId);
    return { key, revision: book?.revision ?? 0, edition: book?.edition ?? "", file: file ? { id: file.id, filename: file.filename, pages: file.pages!, size: file.size, uploadedAt: file.uploadedAt!.toISOString() } : null };
  });
}
export async function beginPriceBook(db: PrismaClient, storage: AttachmentStorage, actorId: string, input: { key: string; revision: number; edition: string; filename: string; size: number; requestKey: string }) {
  if (!input || !isBookKey(input.key) || !validEdition(input.edition) || !Number.isSafeInteger(input.revision) || !validAttachmentId(input.requestKey) || typeof input.filename !== "string" || !/\.pdf$/i.test(input.filename) || input.filename.length > 200 || /[\x00-\x1f\x7f/\\]/.test(input.filename) || !Number.isSafeInteger(input.size) || input.size < 5 || input.size > priceBookLimit) throw new Error("Choose a PDF up to 20 MB and a valid edition month/year.");
  const file = await db.$transaction(async tx => {
    await admin(tx, actorId);
    const book = await lock(tx, input.key);
    const previous = await tx.priceBookFile.findUnique({ where: { uploaderId_requestKey: { uploaderId: actorId, requestKey: input.requestKey } } });
    if (previous) {
      if (previous.bookKey !== input.key || previous.filename !== input.filename || previous.size !== input.size || previous.edition !== input.edition || previous.baseRevision !== input.revision || previous.state !== "PENDING" || previous.expiresAt <= new Date()) throw new Error("Start a new upload attempt.");
      return previous;
    }
    if (book.revision !== input.revision) throw new Error("This book changed. Refresh before replacing it.");
    const id = randomUUID();
    const namespace = applicationMode();
    return tx.priceBookFile.create({ data: { id, bookKey: input.key, uploaderId: actorId, requestKey: input.requestKey, baseRevision: input.revision, edition: input.edition, filename: input.filename, size: input.size, stagingKey: `${namespace}/price-books/staging/${id}`, storageKey: `${namespace}/price-books/current/${id}`, expiresAt: new Date(Date.now() + 15 * 60_000) } });
  }, { timeout: 30_000 });
  const seconds = Math.min(600, Math.floor((file.expiresAt.getTime() - Date.now()) / 1000) - 60);
  if (seconds < 1) throw new Error("Upload expired.");
  return { id: file.id, url: await storage.upload(file.stagingKey, "application/pdf", file.size, seconds) };
}
export async function validatePriceBook(bytes: Uint8Array) {
  if (bytes.length > priceBookLimit || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Invalid PDF.");
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
  const pages = pdf.getPageCount();
  if (pdf.isEncrypted || pages < 1 || pages > 2000) throw new Error("Use an unencrypted PDF with 1–2000 pages.");
  return pages;
}
export async function finishPriceBook(db: PrismaClient, storage: AttachmentStorage, actorId: string, id: string) {
  if (!validAttachmentId(id)) throw new Error("Invalid upload.");
  await db.$transaction(async tx => {
    await admin(tx, actorId);
    const candidate = await tx.priceBookFile.findUniqueOrThrow({ where: { id } });
    const book = await lock(tx, candidate.bookKey);
    const file = await tx.priceBookFile.findUniqueOrThrow({ where: { id } });
    if (file.uploaderId !== actorId) throw new Error("Only the uploading admin can verify this attempt.");
    if (file.state === "READY" || file.state === "REPLACED") return;
    if (file.state !== "PENDING" || file.expiresAt <= new Date()) throw new Error("Upload expired.");
    if (book.revision !== file.baseRevision) throw new Error("This book changed during upload. Refresh and upload again.");
    const object = await storage.inspect(file.stagingKey);
    if (object.size !== file.size || object.type !== "application/pdf" || !object.etag) throw new Error("PDF size or type does not match.");
    const original = await storage.read(file.stagingKey, undefined, object.etag);
    const bytes = await original.Body!.transformToByteArray();
    if (bytes.length !== file.size) throw new Error("PDF size does not match.");
    const pages = await validatePriceBook(bytes);
    await storage.promote(file.stagingKey, file.storageKey, object.etag, "application/pdf");
    if (book.currentFileId) await tx.priceBookFile.update({ where: { id: book.currentFileId }, data: { state: "REPLACED" } });
    await tx.priceBookFile.update({ where: { id }, data: { state: "READY", pages, uploadedAt: new Date() } });
    await tx.priceBook.update({ where: { key: book.key }, data: { currentFileId: id, edition: file.edition, revision: { increment: 1 } } });
    await tx.priceBookEvent.create({ data: { bookKey: book.key, actorId, changes: { event: "PDF published", filename: file.filename, pages, edition: file.edition } } });
  }, { timeout: 60_000 });
  return cleanupPriceBooks(db, storage);
}
export async function changeEdition(db: PrismaClient, actorId: string, key: string, revision: number, edition: string) {
  if (!isBookKey(key) || !Number.isSafeInteger(revision) || !validEdition(edition)) throw new Error("Invalid edition.");
  await db.$transaction(async tx => {
    await admin(tx, actorId);
    const book = await lock(tx, key);
    if (book.revision !== revision) throw new Error("This book changed. Refresh before editing its edition.");
    if (book.edition === edition) return;
    await tx.priceBook.update({ where: { key }, data: { edition, revision: { increment: 1 } } });
    await tx.priceBookEvent.create({ data: { bookKey: key, actorId, changes: { event: "Edition changed", before: book.edition, after: edition } } });
  }, { timeout: 30_000 });
}
export async function cleanupPriceBooks(db: PrismaClient, storage: AttachmentStorage) {
  const due = await db.priceBookFile.findMany({ where: { OR: [{ state: "REPLACED", objectCleanedAt: null }, { stagingCleanedAt: null, expiresAt: { lt: new Date() } }, { state: "PENDING", expiresAt: { lt: new Date() } }] }, take: 10, orderBy: { expiresAt: "asc" } });
  let cleaned = 0;
  const deadline = Date.now() + 30_000;
  for (const candidate of due) {
    if (Date.now() >= deadline) break;
    try {
      await db.$transaction(async tx => {
        const book = await lock(tx, candidate.bookKey);
        const file = await tx.priceBookFile.findUniqueOrThrow({ where: { id: candidate.id } });
        // Staging URLs may still be writable until expiration; clean them only afterwards.
        if (!file.stagingCleanedAt && file.expiresAt <= new Date()) {
          await storage.remove(file.stagingKey);
          await tx.priceBookFile.update({ where: { id: file.id }, data: { stagingCleanedAt: new Date() } });
        }
        if (book.currentFileId !== file.id && !file.objectCleanedAt && (file.state === "REPLACED" || (file.state === "PENDING" && file.expiresAt <= new Date()))) {
          await storage.remove(file.storageKey);
          await tx.priceBookFile.update({ where: { id: file.id }, data: { objectCleanedAt: new Date(), ...(file.state === "PENDING" ? { state: "EXPIRED" } : {}) } });
        }
      }, { timeout: 40_000 });
      cleaned++;
    } catch { /* Durable metadata remains for the admin's next retry. */ }
  }
  return { checked: due.length, cleaned };
}
