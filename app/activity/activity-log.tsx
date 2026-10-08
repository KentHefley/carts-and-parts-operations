import Link from "next/link";
import { getDatabase } from "../../lib/db";
import { readActivity } from "../../lib/activity-store";
import { orderFields } from "../../lib/order-fields";
import { activityValue, itemHistoryRows } from "../../lib/activity-format";

function label(key: string) {
  return orderFields.find(field => field.key === key)?.label ?? ({ name: "Name", dateEntered: "Date Entered", status: "Status", items: "Item rows", assignments: "Assigned To", completedBy: "Completed By", completionDate: "Completion Date", voidedBy: "Voided By", voidedDate: "Voided Date", statusChangedAt: "Status changed at", event: "Event" } as Record<string, string>)[key] ?? key;
}
function changeDetails(key: string, change: unknown, names: Map<string, string>) {
  if (change && typeof change === "object" && "before" in change && "after" in change) {
    if (key === "items") return <div className="table-scroll"><table><thead><tr><th>Item</th><th>Field</th><th>Previous value</th><th>New value</th></tr></thead><tbody>{itemHistoryRows(change.before, change.after).map(row => <tr key={`${row.item}-${row.field}`}><td>Item {row.item}</td><td>{row.field}</td><td>{activityValue(row.before, names)}</td><td>{activityValue(row.after, names)}</td></tr>)}</tbody></table></div>;
    return <>{activityValue(change.before, names)} → {activityValue(change.after, names)}</>;
  }
  return activityValue(change, names);
}

// Call only from pages that have already enforced approved employee access.
export async function ActivityLog({ orderId, cursor, dashboard = false }: { orderId?: string; cursor?: string; dashboard?: boolean }) {
  const { events, names, nextCursor } = await readActivity(getDatabase(), { orderId, cursor });
  const path = orderId ? `/orders/${orderId}/activity` : "/activity";
  return <section aria-label={orderId ? "Sales order activity" : "Dashboard activity"}>
    <p>Newest first. Times are UTC. Related field edits within one minute are summarized; status and assignment changes remain separate.</p>
    {events.length === 0 && <p>No activity to display.</p>}
    <ol className="activity-list">{events.map(event => <li key={event.id}>
      {!orderId && <p><Link href={`/orders/${event.order.id}`}>DEV-{String(event.order.number).padStart(6, "0")} · {event.order.name}</Link></p>}
      <strong>{event.actor.displayName || event.actor.email}</strong> · <time dateTime={event.createdAt.toISOString()}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }).format(event.createdAt)} UTC</time>
      <dl>{Object.entries(event.changes as Record<string, unknown>).map(([key, change]) => <div key={key}><dt>{label(key)}</dt><dd>{changeDetails(key, change, names)}</dd></div>)}</dl>
    </li>)}</ol>
    <nav aria-label="Activity pages">{cursor && <Link href={path}>Newest activity</Link>} {nextCursor && <Link href={`${path}?before=${nextCursor}`}>Older activity</Link>} {dashboard && <Link href="/activity">Open dashboard activity</Link>}</nav>
  </section>;
}
