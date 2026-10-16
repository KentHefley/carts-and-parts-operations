import { notFound } from "next/navigation";
import { requireApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { loadOrder } from "../../../../lib/order-store";
import { readFieldLayout } from "../../../../lib/custom-field-store";
import { PrintDocument } from "../../print-document";
export default async function PrintOrder({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedUser(); const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getDatabase();
  if (!await db.salesOrder.count({ where: { id, deletedAt: null } })) notFound();
  const [order, layout, users] = await Promise.all([loadOrder(db, id), readFieldLayout(db), db.appUser.findMany({ select: { id: true, displayName: true, email: true } })]);
  return <PrintDocument order={order} layout={layout} users={users} />;
}
