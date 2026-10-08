import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { ActivityLog } from "../../../activity/activity-log";
import { AuthenticatedShell } from "../../../ui/authenticated-shell";
import { OrderTabs } from "../../order-tabs";
import { terminalStatus } from "../../../../lib/order-status";

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string }> }) {
  const user = await requireApprovedUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getDatabase().salesOrder.findUnique({ where: { id }, select: { name: true, number: true, fields: true } });
  if (!order) notFound();
  const { before } = await searchParams;
  const cursor = typeof before === "string" && /^[0-9a-f-]{36}$/i.test(before) ? before : undefined;
  const completed = terminalStatus((order.fields as Record<string, string>).status);
  return <AuthenticatedShell title="Sales Order" active={completed ? "Completed Sales Orders" : "Sales Orders"} admin={user.role === "ADMIN"}><main className="order-page"><header className="order-header"><div><p className="development-label">Development</p><h1>DEV-{String(order.number).padStart(6, "0")} · {order.name}</h1></div><Link href={completed ? "/completed-orders" : "/sales-orders"}>{completed ? "Completed Sales Orders" : "Sales Orders"}</Link></header><div className="save-toolbar"><OrderTabs orderId={id} current="activity" /></div><section className="form-section"><h2>Order Activity</h2><ActivityLog orderId={id} cursor={cursor} /></section></main></AuthenticatedShell>;
}
