import type { OrderView } from "./order-types";

// Explicit selection: new form fields must never silently expand this email.
const selection = [
  ["Date Entered", "dateEntered"], ["Division", "division__1"], ["Purchase Order", "text_28__1"], ["Scheduled Job Date", "start_job_date__1"],
  ["Salesman", "dup__of_text3__1"], ["Job Type", "dropdown__1"], ["Priority", "priority__1"], ["Terms", "terms__1"], ["NTE", "text_12__1"], ["Price Level", "dup__of_priority__1"], ["Freight", "text772__1"], ["Miles", "numbers__1"],
  ["Invoice To", "text_13__1"], ["Invoice Address", "text_16__1"], ["Invoice City", "text_17__1"], ["Invoice State", "text_18__1"], ["Invoice ZIP", "text_19__1"], ["Invoice Contact", "text_15__1"], ["Invoice Phone", "text71__1"],
  ["Store Name", "text_21__1"], ["Store Number", "text_22__1"], ["Store Address", "text_24__1"], ["Store City", "text_25__1"], ["Store State", "text_26__1"], ["Store ZIP", "text_27__1"], ["Store Contact", "text_23__1"], ["Store Phone", "text_30__1"], ["Email", "text_31__1"], ["Description of Service", "text_32__1"],
] as const;
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function orderEmailTemplate(order: OrderView) {
  const rows: [string, string][] = selection.map(([label, key]) => [label, order.fields[key] ?? ""]);
  order.items.forEach((item, index) => rows.push([`Item ${index + 1} Quantity`, item.quantity], [`Item ${index + 1} Description`, item.description]));
  rows.push(["Labor Description", order.fields.text81__1 ?? ""], ["Travel Description", order.fields.text32__1 ?? ""], ["AM Description", order.fields.text14__1 ?? ""], ["SO Additional Info", order.fields.additional_info__1 ?? ""], ["Submitted By", order.creator]);
  return {
    subject: `SALES ORDER: ${order.number}`,
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:17px;color:#111"><h1 style="font-size:16px;line-height:20px;margin:0 0 6px">Sales Order ${escape(order.number)}</h1>${rows.map(([label, value]) => `<div style="margin:0;padding:0;line-height:17px;overflow-wrap:anywhere">${escape(label)}: <span style="white-space:pre-wrap">${escape(value)}</span></div>`).join("")}</div>`,
  };
}
