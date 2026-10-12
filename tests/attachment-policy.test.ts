import { test } from "node:test";
import assert from "node:assert/strict";
import { attachmentInput, fileSignature, canManageAttachments } from "../lib/attachment-policy";
test("attachment limits, safe filenames and declared types", () => {
  assert.equal(attachmentInput("Receipt.PDF", 20_000_000).contentType, "application/pdf");
  for (const [name, size] of [["empty.pdf", 0], ["big.pdf", 20_000_001], ["../file.pdf", 8], ["bad\r.pdf", 8], ["script.svg", 8], ["file.exe", 8]]) assert.throws(() => attachmentInput(name, size));
});
test("actual file signatures cannot be replaced by extension alone", () => {
  assert.equal(fileSignature(Buffer.from("%PDF-1.7"), "application/pdf"), true);
  assert.equal(fileSignature(Buffer.from("<html>"), "application/pdf"), false);
  assert.equal(fileSignature(Uint8Array.from([255, 216, 255]), "image/jpeg"), true);
  assert.equal(fileSignature(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"), true);
  assert.equal(fileSignature(Buffer.from("RIFFxxxxWEBP"), "image/webp"), true);
});
test("file mutation requires an active administrator or assigned employee", () => {
  assert.equal(canManageAttachments(true, "ADMIN", false), true);
  assert.equal(canManageAttachments(true, "USER", true), true);
  assert.equal(canManageAttachments(true, "USER", false), false);
  assert.equal(canManageAttachments(false, "ADMIN", true), false);
});
