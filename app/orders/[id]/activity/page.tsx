import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { ActivityLog } from "../../../activity/activity-log";
import { AuthenticatedShell } from "../../../ui/authenticated-shell";

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string }> }) {
  const user = await requireApprovedUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getDatabase().salesOrder.findUnique({ where: { id }, select: { name: true, number: true } });
  if (!order) notFound();
  const { before } = await searchParams;
  const cursor = typeof before === "string" && /^[0-9a-f-]{36}$/i.test(before) ? before : undefined;
  return <AuthenticatedShell title="Order Activity" active="Sales Orders" admin={user.role === "ADMIN"}><main className="screen-page"><div className="screen-heading"><div><p className="eyebrow">Order Activity</p><h1>DEV-{String(order.number).padStart(6, "0")} · {order.name}</h1></div><Link href={`/orders/${id}`}>Order Details</Link></div><div className="content-panel"><ActivityLog orderId={id} cursor={cursor} /></div></main></AuthenticatedShell>;
}
