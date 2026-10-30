import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { readOrderBoard } from "../../lib/order-board-store";
import { OrderList } from "./order-list";
import { NewOrderButton } from "./new-order-button";
import { AuthenticatedShell } from "../ui/authenticated-shell";

export async function OrderScreen({ completed = false }: { completed?: boolean }) {
  const user = await requireApprovedUser();
  const page = await readOrderBoard(getDatabase(), user.id, { completed, name: "", number: "", status: "" });
  const title = completed ? "Completed Sales Orders" : "Sales Orders";
  return <AuthenticatedShell title={title} active={title} admin={user.role === "ADMIN"}>
    <main className="screen-page"><div className="screen-heading"><div><p className="eyebrow">Orders</p><h1>{title}</h1><p className="screen-caption">{completed ? "Completed and voided orders, with their details and history." : "Create, find and manage your team's sales orders."}</p></div>{!completed && <NewOrderButton />}</div>
    <section className="content-panel" aria-label={title}><OrderList key={title} admin={user.role === "ADMIN"} completed={completed} initialPage={page} /></section>
    </main>
  </AuthenticatedShell>;
}
