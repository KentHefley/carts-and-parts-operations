import { requireApprovedUser } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { loadOrder } from "../../../lib/order-store";
import { OrderForm } from "../order-form";
import { notFound } from "next/navigation";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !await getDatabase().salesOrder.findUnique({ where: { id }, select: { id: true } })) notFound();
  return <OrderForm initial={await loadOrder(getDatabase(), id)} />;
}
