import { requireApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { attachmentStorage } from "../../../../lib/attachment-storage";
import { isBookKey } from "../../../../lib/price-book-types";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  await requireApprovedUser();
  const { key } = await params;
  if (!isBookKey(key)) return new Response("Not found", { status: 404 });
  const book = await getDatabase().priceBook.findUnique({ where: { key } });
  if (!book?.currentFileId) return new Response("Book not uploaded", { status: 404 });
  const url = new URL(request.url);
  if (url.searchParams.get("file") !== book.currentFileId) return new Response("This book changed. Close and reopen the viewer.", { status: 409 });
  const file = await getDatabase().priceBookFile.findFirst({ where: { id: book.currentFileId, bookKey: key, state: "READY" } });
  if (!file) return new Response("Not found", { status: 404 });
  const range = request.headers.get("range");
  if (range && !/^bytes=\d+-\d*$/.test(range)) return new Response("Invalid range", { status: 416 });
  try {
    const object = await attachmentStorage().read(file.storageKey, range ?? undefined);
    const headers = new Headers({ "Content-Type": "application/pdf", "Content-Disposition": `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="price-book.pdf"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/['()*]/g, value => `%${value.charCodeAt(0).toString(16)}`)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes", "Content-Security-Policy": "sandbox" });
    if (object.ContentLength !== undefined) headers.set("Content-Length", String(object.ContentLength));
    if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
    return new Response(object.Body!.transformToWebStream(), { status: range ? 206 : 200, headers });
  } catch { return new Response("PDF temporarily unavailable", { status: 503 }); }
}
