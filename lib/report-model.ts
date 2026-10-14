import { Prisma } from "../generated/prisma/client";
import { DateTime } from "luxon";

export type ReportFilter = { kind: "sales" | "products" | "customer"; from: string; to: string; query: string };
export type ReportOrder = { id: string; number: number; name: string | null; deletedAt: Date | null; fields: unknown; items: { description: string; quantity: { toString(): string } | null; unitPrice: { toString(): string } | null }[]; assignments: { user: { displayName: string | null; email: string } }[] };
const D = Prisma.Decimal.clone({ precision: 60 });
// Use explicit rounding; never mutate Decimal's shared global configuration.
const cents = (value: Prisma.Decimal) => value.toDecimalPlaces(2, D.ROUND_HALF_UP);
const normal = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const productTerms = (query: string) => [...new Set(query.split(",").map(term => normal(term).replace(/\s/g, "")).filter(Boolean))];
export function reportFilter(input: Record<string, string | string[] | undefined>): ReportFilter {
  const one = (key: string) => { const value = input[key]; if (Array.isArray(value)) throw new Error("Use one value per report filter."); return value ?? ""; };
  const kind = one("kind") || "sales", from = one("from"), to = one("to"), query = one("query").trim();
  if (!["sales", "products", "customer"].includes(kind)) throw new Error("Choose a report type.");
  if (![from, to].every(validDate) || from > to) throw new Error("Choose a valid Date Entered range with the start on or before the end.");
  if (query.length > 200) throw new Error("Use a search of 200 characters or fewer.");
  if (kind !== "sales" && !query) throw new Error(kind === "products" ? "Enter a product number or description to search." : "Enter an Invoice To customer name to search.");
  if (kind === "products" && !productTerms(query).length) throw new Error("Enter at least one product search term, separated by commas.");
  return { kind: kind as ReportFilter["kind"], from, to, query: kind === "sales" ? "" : query };
}
function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid && DateTime.fromISO(value).toISODate() === value; }
function numeric(value: string) {
  if (!value.trim()) return new D(0);
  // Existing manual price fields are text: accept plain decimals only, flag everything else.
  if (!/^-?\d{1,14}(\.\d{1,6})?$/.test(value.trim())) return null;
  return new D(value.trim());
}
export function money(value: string | null) {
  if (value === null) return "Needs review";
  const [whole, fraction] = new D(value).toFixed(2).split(".");
  return `${whole.startsWith("-") ? "-" : ""}$${whole.replace("-", "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
}
export function buildReport(orders: ReportOrder[], filter: ReportFilter) {
  const terms = productTerms(filter.query);
  const groups = new Map<string, { description: string; quantity: Prisma.Decimal; total: Prisma.Decimal; orders: Set<string>; invalid: boolean }>();
  const rows: { id: string; number: string; name: string; date: string; customer: string; status: string; division: string; jobType: string; scheduled: string; assigned: string; subtotal: string | null; matching: string | null; issues: string[] }[] = [];
  let subtotal = new D(0), matchingTotal = new D(0), quantityTotal = new D(0), invalidOrders = 0, invalidProducts = false;
  for (const order of orders) {
    const fields = (order.fields ?? {}) as Record<string, string>;
    if (order.deletedAt || !order.name?.trim() || !["Pending", "In Progress", "Expedite", "Complete"].includes(fields.status) || !validDate(fields.dateEntered ?? "") || fields.dateEntered < filter.from || fields.dateEntered > filter.to) continue;
    if (filter.kind === "customer" && !normal(fields.text_13__1 ?? "").includes(normal(filter.query))) continue;
    const matching = order.items.filter(item => terms.some(term => normal(item.description).replace(/\s/g, "").includes(term)));
    if (filter.kind === "products" && !matching.length) continue;
    const issues: string[] = [];
    let orderSum = new D(0), itemSum = new D(0), invalidMatching = false;
    order.items.forEach((item, index) => {
      const quantity = numeric(item.quantity?.toString() ?? ""), price = numeric(item.unitPrice?.toString() ?? "");
      const charge = quantity && price ? cents(quantity.times(price)) : null;
      if (charge === null) issues.push(`Item ${index + 1}: invalid quantity or unit price`); else orderSum = orderSum.plus(charge);
      if (filter.kind !== "products" || !matching.includes(item)) return;
      const key = normal(item.description), group = groups.get(key) ?? { description: item.description.trim().replace(/\s+/g, " "), quantity: new D(0), total: new D(0), orders: new Set<string>(), invalid: false };
      group.orders.add(order.id);
      if (quantity) { group.quantity = group.quantity.plus(quantity); quantityTotal = quantityTotal.plus(quantity); }
      if (charge) { group.total = group.total.plus(charge); itemSum = itemSum.plus(charge); } else { group.invalid = true; invalidMatching = true; invalidProducts = true; }
      groups.set(key, group);
    });
    for (const [label, key] of [["Labor Price", "text06__1"], ["Travel Price", "text0__1"]]) {
      const value = numeric(fields[key] ?? "");
      if (value === null) issues.push(`${label}: enter a plain numeric amount`); else orderSum = orderSum.plus(cents(value));
    }
    if (issues.length) invalidOrders++; else subtotal = subtotal.plus(orderSum);
    matchingTotal = matchingTotal.plus(itemSum);
    rows.push({ id: order.id, number: `DEV-${String(order.number).padStart(6, "0")}`, name: order.name, date: fields.dateEntered, customer: fields.text_13__1 || "", status: fields.status, division: fields.division__1 || "", jobType: fields.dropdown__1 || "", scheduled: fields.start_job_date__1 || "", assigned: order.assignments.map(a => a.user.displayName || a.user.email).join(", "), subtotal: issues.length ? null : orderSum.toFixed(2), matching: invalidMatching ? null : itemSum.toFixed(2), issues });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  return { rows, subtotal: invalidOrders ? null : subtotal.toFixed(2), matchingTotal: invalidProducts ? null : matchingTotal.toFixed(2), quantity: quantityTotal.toString(), invalidOrders, groups: [...groups.values()].map(group => ({ description: group.description, quantity: group.quantity.toString(), total: group.invalid ? null : group.total.toFixed(2), orders: group.orders.size })).sort((a, b) => a.description.localeCompare(b.description)) };
}
