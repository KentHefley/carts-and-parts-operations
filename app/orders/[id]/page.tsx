import { requireApprovedUser } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { loadOrder } from "../../../lib/order-store";
import { OrderForm } from "../order-form";
import { notFound } from "next/navigation";
import { AuthenticatedShell } from "../../ui/authenticated-shell";
import { terminalStatus } from "../../../lib/order-status";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireApprovedUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !await getDatabase().salesOrder.findUnique({ where: { id }, select: { id: true } })) notFound();
  const initial = await loadOrder(getDatabase(), id);
  const users = await getDatabase().appUser.findMany({ where: { OR: [{ active: true }, { id: { in: initial.assigneeIds } }] }, select: { id: true, email: true, displayName: true, active: true }, orderBy: [{ displayName: "asc" }, { email: "asc" }] });
  return <AuthenticatedShell title="Sales Order" active={terminalStatus(initial.fields.status) ? "Completed Sales Orders" : "Sales Orders"} admin={user.role === "ADMIN"}><OrderForm initial={initial} users={users} /></AuthenticatedShell>;
}
