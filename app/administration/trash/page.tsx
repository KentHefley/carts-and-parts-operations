import Link from "next/link";
import { requireAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { listTrash } from "../../../lib/trash-store";
import { AuthenticatedShell } from "../../ui/authenticated-shell";
import { TrashControl } from "./trash-controls";

const date = (value: Date | null) => value ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }).format(value) : "—";
export default async function Trash({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireAdmin();
  const db = getDatabase();
  const query = await searchParams;
  const page = Math.max(1, Math.min(100_000, Number.parseInt(query.page ?? "1", 10) || 1));
  const orders = await listTrash(db, user.id, page);
  const count = await db.salesOrder.count({ where: { deletedAt: { not: null }, purgedAt: null } });
  return <AuthenticatedShell title="Trash" active="Administration" admin><main className="screen-page"><div className="screen-heading"><div><Link href="/administration">Administration</Link><h1>Trash</h1><p>Admins can restore orders for 30 days. Expired orders and their files are permanently removed by cleanup. Times shown in America/Chicago.</p></div><TrashControl /></div><section className="content-panel"><p>Showing {orders.length} of {count} deleted orders.</p>{orders.length ? <div className="table-scroll"><table><thead><tr><th>SO Number</th><th>Name</th><th>Previous Status</th><th>Assigned To</th><th>Files</th><th>Deleted</th><th>Expires</th><th>Action</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td>DEV-{String(order.number).padStart(6, "0")}</td><td>{order.name || "Unnamed order"}</td><td>{(order.fields as Record<string, string>).status || "—"}</td><td>{order.assignments.map(value => (value.user.displayName || value.user.email) + (value.user.active ? "" : " (inactive)")).join(", ") || "—"}</td><td>{order._count.attachments}</td><td>{date(order.deletedAt)}</td><td>{date(order.purgeAfter)}</td><td>{!order.purgingAt && order.purgeAfter && order.purgeAfter > new Date() ? <TrashControl orderId={order.id} /> : "Expired — cleanup pending"}</td></tr>)}</tbody></table></div> : <p className="empty-message">Trash is empty.</p>}</section><nav aria-label="Trash pages">{page > 1 && <Link href={`/administration/trash?page=${page - 1}`}>Previous page</Link>} <span>Page {page}</span> {page * 50 < count && <Link href={`/administration/trash?page=${page + 1}`}>Next page</Link>}</nav></main></AuthenticatedShell>;
}
