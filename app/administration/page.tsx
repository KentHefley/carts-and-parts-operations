import Link from "next/link";
import { requireAdmin } from "../../lib/access";
import { AuthenticatedShell } from "../ui/authenticated-shell";

export default async function Administration() {
  await requireAdmin();
  return <AuthenticatedShell title="Administration" active="Administration" admin><main className="screen-page"><h1>Administration</h1><div className="dashboard-cards"><Link className="dashboard-card" href="/administration/trash" prefetch={false}><div><h2>Trash</h2><p>Restore deleted orders within 30 days and review permanent cleanup.</p></div><span aria-hidden="true">→</span></Link></div><p>Other administration settings are coming later.</p></main></AuthenticatedShell>;
}
