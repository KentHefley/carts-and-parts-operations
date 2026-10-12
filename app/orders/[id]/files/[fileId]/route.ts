import { requireApprovedUser } from "../../../../../lib/access";
import { getDatabase } from "../../../../../lib/db";
import { attachmentStorage } from "../../../../../lib/attachment-storage";
import { validAttachmentId } from "../../../../../lib/attachment-policy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  await requireApprovedUser();
  const { id, fileId } = await params;
  if (!validAttachmentId(id) || !validAttachmentId(fileId)) return new Response("Not found", { status: 404 });
  const file = await getDatabase().orderAttachment.findFirst({ where: { id: fileId, orderId: id, state: "READY", order: { deletedAt: null } } });
  if (!file) return new Response("Not found", { status: 404 });
  const range = request.headers.get("range");
  if (range && !/^bytes=\d+-\d*$/.test(range)) return new Response("Invalid range", { status: 416 });
  try {
    const object = await attachmentStorage().read(file.storageKey, range ?? undefined);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const headers = new Headers({ "Content-Type": file.contentType, "Content-Disposition": `${download ? "attachment" : "inline"}; filename="attachment.${file.filename.split(".").pop()?.toLowerCase()}"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/['()*]/g, value => `%${value.charCodeAt(0).toString(16)}`)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes", "Content-Security-Policy": "sandbox" });
    if (object.ContentLength !== undefined) headers.set("Content-Length", String(object.ContentLength));
    if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
    return new Response(object.Body!.transformToWebStream(), { status: range ? 206 : 200, headers });
  } catch { return new Response("File temporarily unavailable", { status: 503 }); }
}
