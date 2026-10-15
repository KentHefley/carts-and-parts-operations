import Link from "next/link";
import { requireAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { readOrderChoices } from "../../../lib/order-choice-store";
import { choiceFields } from "../../../lib/order-choice-policy";
import { AuthenticatedShell } from "../../ui/authenticated-shell";
import { ChoiceSettings } from "./choice-settings";
export default async function DropdownChoices() {
  await requireAdmin();
  const db = getDatabase();
  const [rows, history] = await Promise.all([readOrderChoices(db), db.orderChoiceAudit.findMany({ orderBy: { createdAt: "desc" }, take: 50 })]);
  return <AuthenticatedShell title="Dropdown Choices" active="Administration" admin><main className="screen-page">
    <Link href="/administration">Administration</Link><h1>Dropdown Choices</h1>
    <p>Add choices or deactivate ones you no longer use. Saved order values stay intact. Open order forms receive current choices when reloaded.</p>
    <ChoiceSettings rows={rows} />
    <details className="content-panel"><summary>Recent Choice History</summary><p>Latest 50 changes · America/Chicago</p><ol>{history.map(row => {
      const change = row.changes as { actor: string; fieldKey: string; label: string; action: string };
      return <li key={row.id}><strong>{change.actor}</strong> · {row.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" })}<p>{choiceFields.find(field => field.key === change.fieldKey)?.label}: {change.label} · {change.action}</p></li>;
    })}</ol>{!history.length && <p>No changes recorded yet.</p>}</details>
  </main></AuthenticatedShell>;
}
