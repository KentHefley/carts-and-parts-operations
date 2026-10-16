import Link from "next/link";
import { requireAdmin } from "../../lib/access";
import { AuthenticatedShell } from "../ui/authenticated-shell";
export default async function Administration() {
  await requireAdmin();
  return <AuthenticatedShell title="Administration" active="Administration" admin><main className="screen-page"><h1>Administration</h1><div className="dashboard-cards"><Link className="dashboard-card" href="/administration/trash" prefetch={false}><div><h2>Trash</h2><p>Restore deleted orders within 30 days and review permanent cleanup.</p></div><span aria-hidden="true">→</span></Link><Link className="dashboard-card" href="/administration/users" prefetch={false}><div><h2>User Management</h2><p>Manage employee roles and active access.</p></div><span aria-hidden="true">→</span></Link><Link className="dashboard-card" href="/administration/choices" prefetch={false}><div><h2>Dropdown Choices</h2><p>Manage Terms, Freight-Shipping, Job Type and Division choices.</p></div><span aria-hidden="true">→</span></Link><Link className="dashboard-card" href="/administration/fields" prefetch={false}><div><h2>Add Sales Order Field</h2><p>Configure fields, placement and form layout.</p></div><span aria-hidden="true">→</span></Link></div></main></AuthenticatedShell>;
}
