import { requireApprovedUser } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { loadOrder } from "../../../lib/order-store";
import { OrderForm } from "../order-form";
import { notFound } from "next/navigation";
import { NotificationBell } from "../../notifications/notification-bell";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !await getDatabase().salesOrder.findUnique({ where: { id }, select: { id: true } })) notFound();
  const initial = await loadOrder(getDatabase(), id);
  const users = await getDatabase().appUser.findMany({ where: { OR: [{ active: true }, { id: { in: initial.assigneeIds } }] }, select: { id: true, email: true, displayName: true, active: true }, orderBy: [{ displayName: "asc" }, { email: "asc" }] });
  return <><div className="order-notifications"><NotificationBell /></div><OrderForm initial={initial} users={users} /></>;
}
