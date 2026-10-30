import { auth } from "@clerk/nextjs/server";
import { getApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { parseBoardQuery } from "../../../../lib/order-board-model";
import { readOrderBoard } from "../../../../lib/order-board-store";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  if (!(await auth()).userId) return Response.json({ error: "Sign in to view orders." }, { status: 401, headers });
  const user = await getApprovedUser();
  if (!user) return Response.json({ error: "Approved access required." }, { status: 403, headers });
  let query;
  try {
    const params = new URL(request.url).searchParams;
    if (!["true", "false"].includes(params.get("completed") ?? "")) throw new Error("Invalid board.");
    if ((params.get("cursor")?.length ?? 0) > 1000) throw new Error("Invalid cursor.");
    query = parseBoardQuery({ completed: params.get("completed") === "true", name: params.get("name") ?? "", number: params.get("number") ?? "", status: params.get("status") ?? "" }, params.has("cursor") ? JSON.parse(params.get("cursor")!) : null);
  } catch { return Response.json({ error: "Invalid board filters." }, { status: 400, headers }); }
  try { return Response.json(await readOrderBoard(getDatabase(), user.id, query.filters, query.cursor), { headers }); }
  catch { return Response.json({ error: "Could not load orders. Please retry." }, { status: 503, headers }); }
}
