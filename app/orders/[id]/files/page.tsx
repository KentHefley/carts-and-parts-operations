import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApprovedUser } from "../../../../lib/access";
import { getDatabase } from "../../../../lib/db";
import { canManageAttachments, validAttachmentId } from "../../../../lib/attachment-policy";
import { AuthenticatedShell } from "../../../ui/authenticated-shell";
import { terminalStatus } from "../../../../lib/order-status";
import { OrderTabs } from "../../order-tabs";
import { FileManager } from "../../file-manager";

export default async function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireApprovedUser();
  const { id } = await params;
  if (!validAttachmentId(id)) notFound();
  const db = getDatabase();
  const order = await db.salesOrder.findUnique({ where: { id }, include: { assignments: true } });
  if (!order) notFound();
  const files = await db.orderAttachment.findMany({ where: { orderId: id, state: "READY" }, include: { uploader: { select: { displayName: true, email: true } } }, orderBy: { uploadedAt: "desc" } });
  const completed = terminalStatus((order.fields as Record<string, string>).status);
  const admin = actor.role === "ADMIN";
  return <AuthenticatedShell title="Sales Order" active={completed ? "Completed Sales Orders" : "Sales Orders"} admin={admin}><main className="order-page"><header className="order-header"><div><p className="development-label">Development</p><h1>DEV-{String(order.number).padStart(6, "0")} · {order.name}</h1></div><Link href={completed ? "/completed-orders" : "/sales-orders"}>{completed ? "Completed Sales Orders" : "Sales Orders"}</Link></header><div className="save-toolbar"><OrderTabs orderId={id} current="files" /></div><FileManager orderId={id} admin={admin} canManage={canManageAttachments(true, actor.role, order.assignments.some(value => value.userId === actor.id))} files={files.map(file => ({ id: file.id, filename: file.filename, size: file.size, contentType: file.contentType, uploader: file.uploader.displayName || file.uploader.email, uploadedAt: file.uploadedAt!.toISOString() }))} /></main></AuthenticatedShell>;
}
