import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { listOrders } from "../../lib/order-store";
import { OrderList } from "./order-list";
import { NewOrderButton } from "./new-order-button";
import { AuthenticatedShell } from "../ui/authenticated-shell";

export async function OrderScreen({ completed = false }: { completed?: boolean }) {
  const user = await requireApprovedUser();
  const orders = await listOrders(getDatabase(), completed);
  const sortKey = completed ? "statusChangedAt" : "dateEntered";
  const title = completed ? "Completed Sales Orders" : "Sales Orders";
  return <AuthenticatedShell title={title} active={title} admin={user.role === "ADMIN"}>
    <main className="screen-page"><div className="screen-heading"><div><p className="eyebrow">Orders</p><h1>{title}</h1><p className="screen-caption">{completed ? "Completed and voided orders, with their details and history." : "Create, find and manage your team's sales orders."}</p></div>{!completed && <NewOrderButton />}</div>
    <section className="content-panel" aria-label={title}><OrderList completed={completed} orders={[...orders].sort((left, right) => String((right.fields as Record<string, string>)[sortKey] ?? "").localeCompare(String((left.fields as Record<string, string>)[sortKey] ?? ""))).map(order => { const fields = order.fields as Record<string, string>; return { id: order.id, number: `DEV-${String(order.number).padStart(6, "0")}`, name: order.name ?? "", status: fields.status ?? "In Progress", division: fields.division__1 ?? "", jobType: fields.dropdown__1 ?? "", scheduled: fields.start_job_date__1 ?? "", assigned: order.assignments.map(assignment => (assignment.user.displayName || assignment.user.email) + (assignment.user.active ? "" : " (inactive)")).join(", ") }; })} /></section>
    </main>
  </AuthenticatedShell>;
}
