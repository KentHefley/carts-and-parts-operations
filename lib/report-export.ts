import { statusLabel } from "./order-status";
import ExcelJS from "exceljs";
import { reportStatusLabels, reportStatuses, reportTitles, reportSubtotalLabel, type buildReport, type ReportFilter } from "./report-model";
type Result = ReturnType<typeof buildReport>;
type Cell = string | number;
export const safeSpreadsheetText = (value: string) => /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value;
const numeric = (value: string | null): Cell => value === null ? "Needs review" : value.replace(/[-.]/g, "").replace(/^0+/, "").length <= 15 ? Number(value) : value;
export function exportTables(result: Result, filter: ReportFilter, generated = new Date()) {
  const summary: Cell[][] = [
    ["Report", reportTitles[filter.kind]],
    ["Date basis", "Date Entered, inclusive; America/Chicago"], ["From", filter.from], ["Through", filter.to], [filter.kind === "products" ? "Search terms (match any)" : filter.kind === "store" ? "Store Name contains" : "Search contains", filter.query || "All"],
    ["Generated (CT)", new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(generated)],
    ["Order Status", reportStatusLabels[filter.status]], ["Statuses", `${reportStatuses(filter.status).map(statusLabel).join(", ")}; Voided and Trash excluded`], ["Matching Orders", result.rows.length],
    ...(filter.kind === "products" ? [["Matching Quantity", numeric(result.quantity)], ["Matching Product Total", numeric(result.matchingTotal)]] : []),
    [reportSubtotalLabel(filter.kind), numeric(result.subtotal)],
    ["Calculation", "Item quantity x unit price + Labor Price + Travel Price. Round each charge to cents, half-up, then sum. Blank optional amounts = zero."],
    ["Exclusions", "Freight, NTE, AM and specialized price fields are excluded pending clarification. Saved order values are not confirmed invoices or payments."],
    ["Product grouping", "Full description ignoring case and extra spaces; no inferred aliases. Each matching order counted once in order subtotals."],
    ...(filter.kind === "products" ? [["Product search", "Comma-separated terms match any. Spacing/case ignored. Each matching item counted once, even when several terms match."]] : []),
    ["Numeric review", result.invalidOrders ? `${result.invalidOrders} order(s) need numeric corrections; affected totals withheld.` : "No invalid numeric values"],
    ["Precision", "Amounts/quantities exceeding Excel's 15-digit precision are exported as exact text. No spreadsheet formulas are generated."],
  ];
  const products: Cell[][] = [["Product Description", "Quantity", "Matching Product Sales", "Orders"], ...result.groups.map(group => [group.description, numeric(group.quantity), numeric(group.total), group.orders])];
  const orders: Cell[][] = [["SO Number", "Name", "Date Entered", "Invoice To", ...(filter.kind === "store" ? ["Store Name"] : []), "Status", "Division", "Job Type", "Scheduled Job Date", "Assigned To", ...(filter.kind === "products" ? ["Matching Product Total"] : []), "Order Subtotal", "Review"], ...result.rows.map(row => [row.number, row.name, row.date, row.customer, ...(filter.kind === "store" ? [row.store] : []), statusLabel(row.status), row.division, row.jobType, row.scheduled, row.assigned, ...(filter.kind === "products" ? [numeric(row.matching)] : []), numeric(row.subtotal), row.issues.join("; ")])];
  return { summary, products, orders };
}
export function reportCsv(result: Result, filter: ReportFilter) {
  const tables = exportTables(result, filter);
  const rows: Cell[][] = [["Summary"], ...tables.summary, [], ...(filter.kind === "products" ? [["Matching Products"], ...tables.products, []] : []), ["Matching Orders"], ...tables.orders];
  return "\uFEFF" + rows.map(row => row.map(value => `"${(typeof value === "string" ? safeSpreadsheetText(value) : String(value)).replaceAll('"', '""')}"`).join(",")).join("\r\n");
}
export async function reportExcel(result: Result, filter: ReportFilter) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = "Carts and Parts Operations";
  const tables = exportTables(result, filter);
  for (const [name, rows] of [["Summary", tables.summary], ...(filter.kind === "products" ? [["Products", tables.products]] : []), ["Orders", tables.orders]] as [string, Cell[][]][]) {
    // Excel rejects a frozen pane with neither rows nor columns frozen.
    const sheet = workbook.addWorksheet(name, { views: name === "Summary" ? [{ state: "normal" }] : [{ state: "frozen", ySplit: 1 }] });
    for (const row of rows) {
      if (row.some(value => typeof value === "string" && value.length > 32760)) throw new Error("Excel cannot fit one of the saved text values in a cell. Narrow the report or use CSV/PDF.");
      sheet.addRow(row.map(value => typeof value === "string" ? safeSpreadsheetText(value) : value));
    }
    sheet.columns.forEach((column, index) => { column.width = name === "Summary" ? (index ? 100 : 30) : index === 1 || (name === "Products" && index === 0) ? 45 : 24; });
    sheet.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; row.eachCell((cell, index) => { if (typeof cell.value === "number") cell.numFmt = /Total|Subtotal|Sales/.test(String(name === "Summary" ? row.getCell(1).value : rows[0][index - 1])) ? '"$"#,##0.00;[Red]-"$"#,##0.00' : "#,##0.######"; }); });
    if (name !== "Summary") { sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length, column: rows[0].length } }; sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF165BAC" } }; }
    else sheet.getColumn(1).font = { bold: true };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
export { reportPdf } from "./report-pdf";
