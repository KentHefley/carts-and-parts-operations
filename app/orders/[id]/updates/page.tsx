import { environmentLabel } from "../../../../lib/environment-label";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { readComments, CommentError } from "../../../../lib/comment-store";
import { terminalStatus } from "../../../../lib/order-status";
import { AuthenticatedShell } from "../../../ui/authenticated-shell";
import { OrderTabs } from "../../order-tabs";
import { CommentPanel } from "../../comment-panel";
export default async function Updates({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string }> }) {
  const actor = await requireApprovedUser();
  const [{ id }, { before }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const db = getDatabase();
  const order = await db.salesOrder.findFirst({ where: { id, deletedAt: null }, select: { number: true, name: true, fields: true } });
  if (!order) notFound();
  const completed = terminalStatus((order.fields as Record<string, string>).status);
  let comments: Awaited<ReturnType<typeof readComments>> | undefined;
  let error = "";
  if (order.name) {
    try { comments = await readComments(db, actor.id, id, before); }
    catch (caught) { if (caught instanceof CommentError) error = caught.message; else throw caught; }
  }
  return <AuthenticatedShell title="Sales Order" active={completed ? "Completed Sales Orders" : "Sales Orders"} admin={actor.role === "ADMIN"}><main className="order-page">
    <header className="order-header"><div><p className="development-label">{environmentLabel}</p><h1>DEV-{String(order.number).padStart(6, "0")} · {order.name || "New Sales Order"}</h1></div><Link href={completed ? "/completed-orders" : "/sales-orders"}>{completed ? "Completed Sales Orders" : "Sales Orders"}</Link></header>
    <div className="save-toolbar"><OrderTabs orderId={id} current="updates" /></div>
    {!order.name && <p>Save the order with a Name before posting comments.</p>}
    {error && <p role="alert">{error} <Link href={`/orders/${id}/updates`}>Newest comments</Link></p>}
    {comments && <><CommentPanel orderId={id} actorId={actor.id} rows={comments.rows} users={comments.users} /><nav className="comment-pages" aria-label="Comment pages">{before && <Link href={`/orders/${id}/updates`} prefetch={false}>Newest comments</Link>}{comments.nextCursor && <Link href={`/orders/${id}/updates?before=${comments.nextCursor}`} prefetch={false}>Older comments</Link>}</nav></>}
  </main></AuthenticatedShell>;
}
