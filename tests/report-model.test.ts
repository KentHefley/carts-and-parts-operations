import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, money, reportFilter, type ReportOrder } from "../lib/report-model";
const filter = reportFilter({ from: "2026-10-01", to: "2026-10-31", kind: "sales" });
const item = (description = "CW2 Refill Kit", quantity = "2.5", unitPrice = "12.34") => ({ description, quantity, unitPrice });
const order = (id: string, fields = {}, items = [item()]): ReportOrder => ({ id, number: Number(id) || 1, name: "Sample Order", deletedAt: null, fields: { status: "In Progress", dateEntered: "2026-10-01", text_13__1: "Sample Customer", text06__1: "10", text0__1: "5", ...fields }, items, assignments: [] });

test("customer/store matching ignores apostrophes but never guesses spelling or changes saved labels", () => {
  const spellings = ["Albertsons", "Albertson's", "Albertson’s", "ALBERTSON‘S", "Albertsonʼs", "Albertson＇s", "Albejttsons"];
  const rows = spellings.map((name, index) => order(String(index + 1), { text_13__1: name, text_21__1: name }));
  for (const kind of ["customer", "store"] as const) {
    for (const query of ["Albertsons", "Albertson's", "ALBERTSON’S"]) {
      const result = buildReport(rows, reportFilter({ ...filter, kind, query }));
      assert.equal(result.rows.length, 6); assert.equal(result.subtotal, "275.10");
      assert.ok(result.rows.some(row => row.customer === "Albertson’s" && row.store === "Albertson’s"));
    }
    assert.throws(() => reportFilter({ ...filter, kind, query: " ' ’ ‘ ʼ ＇ " }), /apostrophes/);
  }
  const products = [order("1", {}, [item("Albertson's part")])];
  assert.equal(buildReport(products, { ...filter, kind: "products", query: "Albertsons" }).rows.length, 0);
});

test("Store Name searches saved store values independently of Invoice To", () => {
  const scoped = reportFilter({ kind: "store", from: filter.from, to: filter.to, query: "  COSTCO   Gilbert  " });
  const rows = [order("1", { text_21__1: "Costco Gilbert #123", status: "Pending" }), order("2", { text_21__1: "COSTCO   GILBERT", status: "Complete", dateEntered: "2026-10-31" }), order("3", { text_13__1: "Costco Gilbert", text_21__1: "Other Store" }), order("4", { text_21__1: "Costco Gilbert", status: "Voided" }), { ...order("5", { text_21__1: "Costco Gilbert" }), deletedAt: new Date() }, order("6", { text_21__1: "Costco Gilbert", dateEntered: "2026-11-01" })];
  const result = buildReport(rows, scoped);
  assert.equal(result.rows.length, 2);
  assert.equal(result.subtotal, "91.70");
  assert.equal(result.rows[0].store, "COSTCO   GILBERT");
  assert.equal(result.rows[0].customer, "Sample Customer");
  assert.equal(buildReport(rows, { ...scoped, status: "open" }).subtotal, "45.85");
  assert.equal(buildReport(rows, { ...scoped, status: "completed" }).subtotal, "45.85");
  assert.equal(buildReport([order("7", { text_21__1: "Store, East" })], { ...scoped, query: "Store, East" }).rows.length, 1);
  assert.equal(buildReport([order("7", { text_21__1: "Store East" })], { ...scoped, query: "Store, East" }).rows.length, 0);
  assert.throws(() => reportFilter({ kind: "store", from: filter.from, to: filter.to, query: " " }), /Store Name/);
});

test("status scope filters all report kinds before totals, never including Voided or Trash", () => {
  assert.equal(filter.status, "all");
  const orders = [order("1", { status: "Pending" }), order("2", { status: "In Progress" }), order("3", { status: "Expedite" }), order("4", { status: "Complete" }), order("5", { status: "Voided" }), { ...order("6", { status: "Complete" }), deletedAt: new Date() }];
  for (const kind of ["sales", "products", "customer"] as const) {
    const base = { ...filter, kind, query: kind === "products" ? "CW2" : kind === "customer" ? "Customer" : "" };
    assert.equal(buildReport(orders, { ...base, status: "all" }).rows.length, 4);
    const open = buildReport(orders, { ...base, status: "open" });
    const completed = buildReport(orders, { ...base, status: "completed" });
    assert.deepEqual(open.rows.map(row => row.status).sort(), ["Expedite", "In Progress", "Pending"]);
    assert.deepEqual(completed.rows.map(row => row.status), ["Complete"]);
    assert.equal(open.subtotal, "137.55"); assert.equal(completed.subtotal, "45.85");
    if (kind === "products") { assert.equal(open.quantity, "7.5"); assert.equal(completed.matchingTotal, "30.85"); }
  }
  assert.throws(() => reportFilter({ from: filter.from, to: filter.to, status: "voided" }));
  assert.throws(() => reportFilter({ from: filter.from, to: filter.to, status: ["open", "completed"] }));
});
test("inclusive dates, canonical statuses, no Trash/drafts, and customer contains", () => {
  const rows = [order("1"), order("2", { dateEntered: "2026-10-31", status: "Complete" }), order("3", { dateEntered: "2026-11-01" }), order("4", { status: "Voided" }), { ...order("5"), deletedAt: new Date() }, { ...order("6"), name: null }, order("7", { dateEntered: "2026-02-30" }), order("8", { status: "Unknown" })];
  assert.equal(buildReport(rows, filter).rows.length, 2);
  assert.equal(buildReport(rows, { ...filter, kind: "customer", query: "CUSTOMER" }).subtotal, "91.70");
  assert.equal(buildReport(rows, { ...filter, kind: "customer", query: "Other" }).rows.length, 0);
});
test("round charges individually half-up with blanks, negatives and large decimals", () => {
  const report = buildReport([order("1", { text06__1: "", text0__1: "", text772__1: "999" }, [item("A", "0.5", "0.01"), item("B", "0.5", "0.01"), item("C", "-0.5", "0.01")])], filter);
  assert.equal(report.subtotal, "0.01");
  assert.equal(buildReport([order("2", { text06__1: "", text0__1: "" }, [item("A", "99999999999999", "99999999999999.99")])], filter).subtotal, "9999999999999899000000000000.01");
  assert.equal(money("12345678901234567890.12"), "$12,345,678,901,234,567,890.12");
});
test("product grouping normalizes case/space, sums quantities and deduplicates order subtotals", () => {
  const report = buildReport([order("1", {}, [item(), item("cw2  REFILL kit", "1", "10"), item("Unrelated", "1", "100")]), order("2", {}, [item("CW2 different", "2", "20")])], { ...filter, kind: "products", query: "cw2" });
  assert.equal(report.groups.length, 2); assert.equal(report.quantity, "5.5");
  assert.equal(report.matchingTotal, "80.85"); assert.equal(report.subtotal, "210.85");
  assert.equal(report.groups.find(group => group.description === "CW2 Refill Kit")?.orders, 1);
  assert.equal(buildReport([order("1", {}, [item("cartWipes CLEAN Refill Kit")])], { ...filter, kind: "products", query: "CW2" }).rows.length, 0);
});
test("invalid text prices withhold subtotals while product totals remain independent", () => {
  const report = buildReport([order("1", { text06__1: "Call for price" })], { ...filter, kind: "products", query: "CW2" });
  assert.equal(report.subtotal, null); assert.equal(report.invalidOrders, 1); assert.equal(report.matchingTotal, "30.85");
  assert.equal(report.rows[0].subtotal, null); assert.match(report.rows[0].issues[0], /Labor/);
});
test("invalid or ambiguous filters rejected", () => {
  assert.throws(() => reportFilter({ ...filter, from: "2026-02-30" }));
  assert.throws(() => reportFilter({ ...filter, to: "2026-09-01" }));
  assert.throws(() => reportFilter({ ...filter, kind: "products" }));
  assert.throws(() => reportFilter({ ...filter, from: ["2026-10-01", "2026-10-02"] }));
  assert.throws(() => reportFilter({ ...filter, kind: "products", query: ", ," }));
});
test("comma-separated product terms match either term and spacing variants without double counts", () => {
  const orders = [order("1", {}, [item("cartWipes refill kit", "2", "10"), item("Hand Baskets", "3", "20"), item("Other", "1", "100")]), order("2", {}, [item("Handbaskets blue", "1", "30")]), order("3", {}, [item("Other", "1", "500")])];
  for (const query of ["cartwipes, handbaskets", "cartwipes, hand baskets", " cartWIPES, hand baskets, CARTWIPES, "]) {
    const report = buildReport(orders, reportFilter({ ...filter, kind: "products", query }));
    assert.equal(report.rows.length, 2); assert.equal(report.quantity, "6");
    assert.equal(report.matchingTotal, "110.00"); assert.equal(report.subtotal, "240.00");
  }
  const overlap = buildReport(orders, { ...filter, kind: "products", query: "cartwipes, refill, kit" });
  assert.equal(overlap.quantity, "2"); assert.equal(overlap.matchingTotal, "20.00");
  assert.equal(buildReport([order("1", { text_13__1: "Customer, Inc." })], { ...filter, kind: "customer", query: "Customer, Inc." }).rows.length, 1);
});
