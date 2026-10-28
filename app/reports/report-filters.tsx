"use client";
import { useState } from "react";
import { DateField } from "../orders/date-field";
export function ReportFilters({ kind, from, to, query, status }: { kind: string; from: string; to: string; query: string; status: string }) {
  const [type, setType] = useState(kind), [start, setStart] = useState(from), [end, setEnd] = useState(to), [search, setSearch] = useState(query);
  return <form className="report-filters content-panel" action="/reports" method="get">
    <label>Report<select name="kind" value={type} onChange={event => { setType(event.target.value); setSearch(""); }}><option value="sales">Sales by Date</option><option value="products">Products</option><option value="customer">Invoice Customer</option><option value="store">Store Name</option></select></label>
    <label>Order Status<select name="status" defaultValue={status}><option value="all">All Orders</option><option value="open">Open Orders</option><option value="completed">Completed Orders</option></select></label>
    <label>Date Entered — From<DateField label="Report start date" value={start} onChange={setStart} /></label><input type="hidden" name="from" value={start} />
    <label>Date Entered — Through<DateField label="Report end date" value={end} onChange={setEnd} /></label><input type="hidden" name="to" value={end} />
    {type !== "sales" && <label className="report-search">{type === "products" ? "Product number or description contains" : type === "store" ? "Store Name contains" : "Invoice To contains"}<input aria-describedby={type === "products" ? "product-search-help" : undefined} name="query" required maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder={type === "products" ? "e.g. CW2, refill kit, shopping cart wheel" : type === "store" ? "Store name" : "Customer name"} /></label>}
    {type === "products" && <p className="screen-caption report-search-help" id="product-search-help">Separate searches with commas to match any term, for example: cartwipes, hand baskets. Spacing and capitalization are ignored; matching items are counted once.</p>}
    {(type === "customer" || type === "store") && <p className="screen-caption report-search-help">Capitalization and apostrophes are ignored, so Albertsons also matches Albertson’s. Spelling mistakes are not automatically included.</p>}
    <button className="primary-button" type="submit" name="run" value="1">Run Report</button>
  </form>;
}
