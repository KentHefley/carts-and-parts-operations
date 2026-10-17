import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { PDFDocument } from "pdf-lib";
import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { attachmentStorage } from "../lib/attachment-storage";

async function run(args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/backup-development.ts", ...args], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.resume();
    child.once("error", () => reject(new Error("Recovery test process could not start.")));
    child.once("exit", (code) => code === 0 ? resolve(output) : reject(new Error("Recovery test process failed; inspect the guarded recovery command separately.")));
  });
}

async function main() {
  const db = createDatabaseClient(developmentCredentials().databaseUrl);
  const storage = attachmentStorage();
  const id = randomUUID();
  const key = `development/recovery-test-fixtures/${id}/receipt.pdf`;
  let userId: string | undefined;
  let orderId: string | undefined;
  let attemptedUpload = false;
  try {
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 200]).drawText("Synthetic order attachment recovery test");
    const bytes = Buffer.from(await pdf.save());
    const user = await db.appUser.create({ data: { clerkUserId: `recovery-test-${id}`, email: `recovery-${id}@example.invalid`, displayName: "Recovery Test Fixture", active: false } });
    userId = user.id;
    const order = await db.salesOrder.create({ data: { creatorId: user.id, requestKey: id, name: `Recovery test ${id}`, fields: { status: "In Progress", purchaseOrder: "RECOVERY-TEST" }, items: { create: { position: 0, description: "Synthetic recovery item", quantity: "2", unitPrice: "12.34" } } } });
    orderId = order.id;
    attemptedUpload = true;
    const signed = await storage.upload(key, "application/pdf", bytes.length);
    const response = await fetch(signed, { method: "PUT", headers: { "content-type": "application/pdf" }, body: bytes, signal: AbortSignal.timeout(60_000) });
    assert.ok(response.ok, "Fixture upload failed.");
    await db.orderAttachment.create({ data: { orderId: order.id, uploaderId: user.id, requestKey: id, filename: "synthetic-receipt.pdf", contentType: "application/pdf", size: bytes.length, stagingKey: `development/recovery-test-fixtures/${id}/unused-staging`, storageKey: key, state: "READY", expiresAt: new Date(Date.now() + 3600_000), uploadedAt: new Date(), stagingCleanedAt: new Date() } });
    const backup = await run(["backup"]);
    const filename = backup.match(/development-[a-f0-9]{24}\.cnpbackup/)?.[0];
    assert.ok(filename, "Backup filename missing.");
    const restored = await run(["drill", filename]);
    const verification = JSON.parse(restored.split("\n").find((line) => line.startsWith('{"restoreVerified"')) ?? "{}");
    assert.equal(verification.restoreVerified, true);
    assert.ok(verification.orderAttachmentAssociations >= 1);
    assert.ok(restored.includes("Isolated restoration cleanup completed."));
    console.log(JSON.stringify({ attachmentRecoveryPassed: true, archive: filename, tables: verification.tables, files: verification.files, orderAttachmentAssociations: verification.orderAttachmentAssociations }));
  } finally {
    // Only identifiers created by this invocation are eligible for cleanup.
    if (attemptedUpload) await storage.remove(key);
    if (orderId) {
      await db.orderAttachment.deleteMany({ where: { orderId } });
      await db.orderItem.deleteMany({ where: { orderId } });
      await db.salesOrder.delete({ where: { id: orderId } });
    }
    if (userId) await db.appUser.delete({ where: { id: userId } });
    await db.$disconnect();
    console.log("Synthetic source fixture cleanup completed.");
  }
}
main().catch(() => { console.error("Attachment recovery test failed; provider details withheld."); process.exitCode = 1; });
