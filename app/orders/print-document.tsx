import Link from "next/link";
import { displayCustom, formSections, type FieldLayout } from "../../lib/custom-field-model";
import { orderEmailSelection } from "../../lib/order-email-template";
import type { OrderView, AssignableUser } from "../../lib/order-types";
import { PrintButton } from "./[id]/print/print-button";
const selected = new Set<string>([...orderEmailSelection.map(([, key]) => key), "text81__1", "text32__1", "text14__1", "additional_info__1", "submittedBy"]);
export function PrintDocument({ order, layout, users }: { order: OrderView; layout: FieldLayout; users: Pick<AssignableUser, "id" | "email" | "displayName">[] }) {
  const names = new Map(users.map(user => [user.id, user.displayName || user.email]));
  const items = order.items.map((item, index) => ({ ...item, index })).filter(item => [item.description, item.quantity, item.unitPrice].some(value => value.trim()));
  return <main className="print-order"><nav><Link href={`/orders/${order.id}`}>Return to Order</Link><PrintButton /><p>Saved values only. Save changes in the order before printing.</p></nav><h1>Sales Order {order.number} · {order.fields.name}</h1>{formSections.map(section => {
    const fields = layout.fields.filter(field => field.active && !field.deleted && field.section === section && (field.custom ? !!order.fields[field.key] : selected.has(field.key)));
    if (!fields.length && !(section === "Items and Pricing" && items.length)) return null;
    return <section key={section}><h2>{section}</h2><dl>{fields.map(field => <div key={field.key}><dt>{field.label}:</dt><dd>{field.key === "submittedBy" ? order.creator : field.custom ? displayCustom(field, order.fields[field.key], names) : order.fields[field.key] || "—"}</dd></div>)}</dl>{section === "Items and Pricing" && items.map(item => <div key={item.index}>Item {item.index + 1} · Quantity: {item.quantity} · Description: {item.description}</div>)}</section>;
  })}</main>;
}
