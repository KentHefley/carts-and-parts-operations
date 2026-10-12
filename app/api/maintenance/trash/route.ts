import { timingSafeEqual } from "node:crypto";
import { getDatabase } from "../../../../lib/db";
import { attachmentStorage } from "../../../../lib/attachment-storage";
import { purgeExpiredOrders } from "../../../../lib/trash-store";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || secret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return new Response("Unauthorized", { status: 401 });
  try {
    const result = await purgeExpiredOrders(getDatabase(), attachmentStorage());
    return Response.json(result, { status: result.purged < result.checked ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch { return new Response("Cleanup unavailable", { status: 503 }); }
}
