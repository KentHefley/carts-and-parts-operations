import Link from "next/link";
import { requireSuperAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { readFieldLayout } from "../../../lib/custom-field-store";
import { AuthenticatedShell } from "../../ui/authenticated-shell";
import { FieldSettings } from "./field-settings";
export default async function SalesOrderFields() {
  await requireSuperAdmin();
  const db = getDatabase();
  const [layout, history] = await Promise.all([readFieldLayout(db), db.orderFieldAudit.findMany({ orderBy: { createdAt: "desc" }, take: 30 })]);
  return <AuthenticatedShell title="Sales Order Fields" active="Administration" admin><main className="screen-page"><Link href="/administration">Administration</Link><h1>Sales Order Fields</h1><p>Configure optional fields and preview the form before saving. Existing order tabs receive settings when reloaded.</p><FieldSettings initial={layout} /><details className="content-panel"><summary>Recent Field History</summary><ol>{history.map(event => { const change = event.changes as { actor: string; action: string; label?: string; affectedOrders?: number }; return <li key={event.id}>{change.actor} · {event.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" })}<p>{change.action}{change.label ? `: ${change.label} (${change.affectedOrders} orders)` : ""}</p></li>; })}</ol></details></main></AuthenticatedShell>;
}
