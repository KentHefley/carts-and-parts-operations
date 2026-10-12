"use server";
import { requireAdmin } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { attachmentStorage } from "../../lib/attachment-storage";
import { beginPriceBook, finishPriceBook, changeEdition, cleanupPriceBooks } from "../../lib/price-book-store";
import { revalidatePath } from "next/cache";

export async function startBookUpload(input: Parameters<typeof beginPriceBook>[3]) {
  const actor = await requireAdmin();
  try { return { ok: true as const, ...await beginPriceBook(getDatabase(), attachmentStorage(), actor.id, input) }; }
  catch (error) { return { ok: false as const, message: error instanceof Error && /Refresh|changed|Choose|attempt|expired/i.test(error.message) ? error.message : "Could not start PDF upload. Check storage and retry." }; }
}
export async function publishBook(id: string) {
  const actor = await requireAdmin();
  try {
    const result = await finishPriceBook(getDatabase(), attachmentStorage(), actor.id, id);
    revalidatePath("/price-books");
    return { ok: true, message: result.cleaned < result.checked ? "PDF published. Some storage cleanup remains pending." : "PDF published. Original quality preserved." };
  } catch { return { ok: false, message: "PDF could not be verified/published. Use a valid unencrypted PDF; if the book changed, refresh and upload again. The existing book stays available." }; }
}
export async function saveBookEdition(key: string, revision: number, edition: string) {
  const actor = await requireAdmin();
  try { await changeEdition(getDatabase(), actor.id, key, revision, edition); revalidatePath("/price-books"); return { ok: true, message: "Edition date saved." }; }
  catch { return { ok: false, message: "Could not save edition. Refresh if another admin changed this book, then retry." }; }
}
export async function retryBookCleanup() {
  await requireAdmin();
  try { const result = await cleanupPriceBooks(getDatabase(), attachmentStorage()); return { ok: true, message: `Storage cleanup processed ${result.cleaned} of ${result.checked} pending records.` }; }
  catch { return { ok: false, message: "Storage cleanup unavailable. Retry later." }; }
}
