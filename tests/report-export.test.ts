import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { buildReport, reportFilter, type ReportOrder } from "../lib/report-model";
import { reportCsv, reportExcel, reportPdf, safeSpreadsheetText, exportTables } from "../lib/report-export";
const filter = reportFilter({ kind: "products", from: "2026-10-01", to: "2026-10-31", query: "CW2" });
const order: ReportOrder = { id: "synthetic", number: 1, name: '=HYPERLINK("evil")', deletedAt: null, fields: { status: "Complete", dateEntered: "2026-10-01", text_13__1: "Customer, Inc.\nSecond line", text06__1: "10", text0__1: "5" }, items: [{ description: "+CW2 refill kit", quantity: "2.5", unitPrice: "12.34" }], assignments: [] };
const result = buildReport([order], filter);

test("Store Name downloads include store details, Invoice To, filters and subtotal", async () => {
  const scoped = reportFilter({ ...filter, kind: "store", query: "Store, East", status: "completed" });
  const results = buildReport([{ ...order, fields: { ...(order.fields as Record<string, string>), text_21__1: "=Store, East" } }], scoped);
  const tables = exportTables(results, scoped);
  assert.deepEqual(tables.summary.find(row => row[0] === "Report"), ["Report", "Store Name"]);
  assert.deepEqual(tables.summary.find(row => row[0] === "Store Name contains"), ["Store Name contains", "Store, East"]);
  assert.deepEqual(tables.summary.find(row => row[0] === "Store Order Subtotal"), ["Store Order Subtotal", 45.85]);
  assert.equal(tables.orders[0][4], "Store Name");
  const csv = reportCsv(results, scoped);
  assert.match(csv, /'=Store, East/);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await reportExcel(results, scoped) as never);
  assert.equal(book.getWorksheet("Orders")!.getCell("E2").value, "'=Store, East");
  assert.equal(book.getWorksheet("Orders")!.getCell("D2").value, "Customer, Inc.\nSecond line");
  assert.ok((await PDFDocument.load(await reportPdf(results, scoped))).getPageCount() >= 2);
});

test("Pending Credit exports retain canonical Pending eligibility and values", async () => {
  const pending = { ...order, fields: { ...(order.fields as Record<string, string>), status: "Pending" } };
  const scoped = { ...filter, status: "open" as const };
  const results = buildReport([pending], scoped);
  assert.equal(results.rows.length, 1);
  assert.equal(results.rows[0].status, "Pending");
  assert.equal(exportTables(results, scoped).orders[1][4], "Pending Credit");
  assert.match(reportCsv(results, scoped), /Pending Credit/);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await reportExcel(results, scoped) as never);
  assert.equal(book.getWorksheet("Orders")!.getCell("E2").value, "Pending Credit");
  assert.equal((pending.fields as Record<string, string>).status, "Pending");
  assert.equal(buildReport([pending], { ...scoped, status: "completed" }).rows.length, 0);
});

test("status-filtered downloads contain the chosen scope and only its matching rows", async () => {
  const orders = [{ ...order, number: 1 }, { ...order, id: "open", number: 2, fields: { ...(order.fields as Record<string, string>), status: "Expedite" } }];
  for (const [status, label, expected, excluded] of [["open", "Open Orders", "DEV-000002", "DEV-000001"], ["completed", "Completed Orders", "DEV-000001", "DEV-000002"]] as const) {
    const scoped = { ...filter, status }, results = buildReport(orders, scoped);
    assert.deepEqual(exportTables(results, scoped).summary.find(row => row[0] === "Order Status"), ["Order Status", label]);
    const csv = reportCsv(results, scoped); assert.ok(csv.includes(label)); assert.ok(csv.includes(expected)); assert.ok(!csv.includes(excluded));
    const book = new ExcelJS.Workbook(); await book.xlsx.load(new Uint8Array(await reportExcel(results, scoped)).buffer);
    assert.equal(book.getWorksheet("Orders")!.rowCount, 2); assert.equal(book.getWorksheet("Orders")!.getCell("A2").value, expected);
    const pdf = await PDFDocument.load(await reportPdf(results, scoped)); assert.ok(pdf.getPageCount() >= 1);
  }
});
test("CSV includes metadata, all sections and safely quotes formulas, commas and newlines", () => {
  const csv = reportCsv(result, filter);
  assert.ok(csv.startsWith("\uFEFF")); assert.match(csv, /Date Entered, inclusive/);
  assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"')); assert.ok(csv.includes('"Customer, Inc.\nSecond line"'));
  assert.ok(csv.includes('"\'+CW2 refill kit"')); assert.ok(csv.includes('"30.85"')); assert.ok(csv.includes('"45.85"'));
  for (const text of ["=SUM(1)", " +SUM(1)", "\t@SUM(1)", "\r-1+2"]) assert.equal(safeSpreadsheetText(text), "'" + text);
});
test("Excel workbook round-trips sections, safe strings and numeric totals", async () => {
  const bytes = await reportExcel(result, filter), workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(bytes).buffer);
  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ["Summary", "Products", "Orders"]);
  assert.equal(workbook.getWorksheet("Products")!.getCell("C2").value, 30.85);
  assert.equal(workbook.getWorksheet("Orders")!.getCell("B2").value, "'" + order.name);
  assert.equal(workbook.getWorksheet("Orders")!.getCell("K2").value, 45.85);
  assert.equal(workbook.getWorksheet("Orders")!.getCell("D2").value, "Customer, Inc.\nSecond line");
  assert.ok(workbook.getWorksheet("Orders")!.autoFilter);
});
test("PDF paginates long text and stays US Letter without dropping unsupported characters", async () => {
  const long = buildReport(Array.from({ length: 12 }, (_, index) => ({ ...order, id: String(index), name: "Synthetic Order Ω 😀 " + "Long readable name ".repeat(20) })), filter);
  const bytes = await reportPdf(long, filter), pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 1); assert.deepEqual(pdf.getPage(0).getSize(), { width: 612, height: 792 });
  await assert.rejects(reportPdf({ ...result, rows: Array.from({ length: 501 }, () => result.rows[0]) }, filter), /500 orders/);
});
test("large values stay exact text in Excel", async () => {
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(new Uint8Array(await reportExcel({ ...result, subtotal: "12345678901234567890.12" }, filter)).buffer);
  let exact = false; workbook.getWorksheet("Summary")!.eachRow(row => { if (row.getCell(2).value === "12345678901234567890.12") exact = true; }); assert.ok(exact);
});
test("downloads include every matching row beyond the on-screen page", async () => {
  const all = buildReport(Array.from({ length: 61 }, (_, index) => ({ ...order, id: String(index), number: index + 1 })), filter);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(new Uint8Array(await reportExcel(all, filter)).buffer);
  assert.equal(workbook.getWorksheet("Orders")!.rowCount, 62);
  assert.ok(reportCsv(all, filter).includes("DEV-000061"));
  assert.ok(reportCsv(all, filter).includes("DEV-000001"));
});
test("all report types use valid worksheet panes, including empty reports", async () => {
  for (const kind of ["sales", "products", "customer"] as const) {
    const selected = reportFilter({ ...filter, kind, query: "CW2" });
    for (const data of [result, buildReport([], selected)]) {
      const zip = await JSZip.loadAsync(await reportExcel(data, selected));
      const summary = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
      assert.ok(!summary.includes("<pane"), `${kind} Summary must not freeze zero rows`);
      const sheets = Object.keys(zip.files).filter(path => /^xl\/worksheets\/sheet\d+\.xml$/.test(path));
      for (const path of sheets.slice(1)) {
        const xml = await zip.file(path)!.async("string");
        assert.match(xml, /<pane[^>]*ySplit="1"[^>]*state="frozen"/);
      }
    }
  }
});
