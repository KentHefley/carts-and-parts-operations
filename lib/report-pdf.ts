import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { reportStatusLabels, reportStatuses, money, type buildReport, type ReportFilter } from "./report-model";

export async function reportPdf(result: ReturnType<typeof buildReport>, filter: ReportFilter) {
  if (result.rows.length > 500 || result.groups.length > 2000) throw new Error("PDF supports up to 500 orders and 2,000 product groups. Narrow the filters, or use Excel/CSV for the full report.");
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(await readFile(join(process.cwd(), "public", "branding", "logo.png")));
  const blue = rgb(.086, .357, .675), ink = rgb(.08, .14, .22), pale = rgb(.89, .93, .98), rule = rgb(.77, .84, .94);
  const supported = new Set(font.getCharacterSet()), title = { sales: "Sales by Date", products: "Products", customer: "Invoice Customer" }[filter.kind];
  const generated = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date());
  const printable = (value: string) => [...value.replace(/\r\n?/g, "\n")].map(char => char === "\n" || supported.has(char.codePointAt(0)!) ? char : `\\u{${char.codePointAt(0)!.toString(16)}}`).join("");
  function wrap(value: string, width: number, size = 9, face: PDFFont = font) {
    const lines: string[] = [];
    for (const paragraph of printable(value).split("\n")) {
      let part = "";
      for (const word of paragraph.split(/(\s+)/)) {
        if (part && face.widthOfTextAtSize(part + word, size) > width) { lines.push(part.trimEnd()); part = ""; }
        if (!part && !word.trim()) continue;
        for (const char of word) {
          if (face.widthOfTextAtSize(part + char, size) > width) { lines.push(part); part = ""; }
          part += char;
        }
      }
      lines.push(part.trimEnd());
    }
    return lines;
  }
  let page: PDFPage, y = 0;
  function next() {
    if (doc.getPageCount() >= 500) throw new Error("PDF exceeds 500 pages. Narrow the filters or use Excel/CSV; no partial PDF was generated.");
    page = doc.addPage([612, 792]);
    const logoWidth = 260, logoHeight = logo.height * logoWidth / logo.width;
    page.drawImage(logo, { x: (612 - logoWidth) / 2, y: 735 - logoHeight / 2, width: logoWidth, height: logoHeight });
    page.drawText(title, { x: (612 - bold.widthOfTextAtSize(title, 19)) / 2, y: 681, font: bold, size: 19, color: blue });
    y = 656;
    for (const text of [`Date Entered: ${filter.from} through ${filter.to}, inclusive (America/Chicago)`, ...(filter.query ? [`${filter.kind === "products" ? "Product description (any comma-separated term; spacing ignored)" : "Invoice To"} contains: ${filter.query}`] : []), `${reportStatusLabels[filter.status]}: ${reportStatuses(filter.status).join(", ")}. Voided and Trash excluded. USD.`]) {
      for (const textLine of wrap(text, 516, 8)) { page.drawText(textLine, { x: 48, y, font, size: 8, color: ink }); y -= 11; }
    }
    y -= 15;
  }
  function line(text: string, heading = false) {
    const face = heading ? bold : font, size = heading ? 11 : 8.5;
    for (const textLine of wrap(text, 516, size, face)) {
      if (y < 58) next();
      page.drawText(textLine, { x: 48, y, size, font: face, color: heading ? blue : ink }); y -= heading ? 17 : 12;
    }
  }
  function table(headers: string[], widths: number[], rows: string[][], rightColumns: number[] = []) {
    const headingLines = headers.map((text, index) => wrap(text, widths[index] - 12, 8, bold));
    const headingHeight = Math.max(...headingLines.map(lines => lines.length)) * 11 + 14;
    function header() {
      page.drawRectangle({ x: 48, y: y - headingHeight, width: 516, height: headingHeight, color: pale });
      let x = 48;
      headingLines.forEach((lines, index) => { lines.forEach((text, offset) => page.drawText(text, { x: x + 6, y: y - 12 - offset * 11, font: bold, size: 8, color: ink })); x += widths[index]; });
      y -= headingHeight;
      page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: 1, color: blue });
    }
    if (y < 120) next(); header();
    rows.forEach((row, rowIndex) => {
      const cells = row.map((text, index) => wrap(text || "—", widths[index] - 12, 8));
      const count = Math.max(...cells.map(lines => lines.length));
      let offset = 0;
      while (offset < count) {
        const remaining = count - offset, usable = Math.floor((y - 58 - 10) / 11);
        if (usable < 1 || (offset === 0 && remaining > usable && remaining * 11 + 14 < 450)) { next(); header(); continue; }
        const take = Math.min(remaining, usable), height = take * 11 + 10;
        if (rowIndex % 2) page.drawRectangle({ x: 48, y: y - height, width: 516, height, color: rgb(.975, .984, .995) });
        let x = 48;
        cells.forEach((lines, index) => { lines.slice(offset, offset + take).forEach((text, position) => page.drawText(text, { x: rightColumns.includes(index) ? x + widths[index] - 6 - font.widthOfTextAtSize(text, 8) : x + 6, y: y - 12 - position * 11, font, size: 8, color: ink })); x += widths[index]; });
        y -= height;
        page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: .4, color: rule }); offset += take;
      }
    });
    y -= 24;
  }
  next();
  if (filter.kind === "products") {
    table(["Product Description", "Quantity Sold", "Product Sales", "Orders"], [306, 60, 90, 60], result.groups.map(group => [group.description, group.quantity, money(group.total), String(group.orders)]), [1, 2, 3]);
    if (y < 190) next();
    line(`Matching Product Total: ${money(result.matchingTotal)}`, true);
    line(`Matching Quantity: ${result.quantity} | Matching Orders: ${result.rows.length}`);
    line(`Full Matching-Order Subtotal: ${money(result.subtotal)}`, true);
    line("Product sales include matching item charges only. Descriptions are grouped ignoring case and extra spaces; no inferred product aliases.");
  } else {
    table(["SO Number", "Name", "Date Entered", "Status", "Division", "Invoice To", "Order Subtotal"], [58, 105, 58, 60, 65, 100, 70], result.rows.map(row => [row.number, row.name, row.date, row.status, row.division, row.customer, money(row.subtotal)]), [6]);
    if (y < 160) next();
    line(`${filter.kind === "customer" ? "Customer Order Subtotal" : "Order Subtotal"}: ${money(result.subtotal)}`, true);
    line(`Matching Orders: ${result.rows.length}`);
  }
  if (!result.rows.length) line("No orders match these filters.");
  if (result.invalidOrders) line(`${result.invalidOrders} order(s) need numeric corrections; affected totals are withheld. See Order Details.`, true);
  y -= 8;
  line("Order Subtotal = item quantity x unit price + Labor Price + Travel Price. Each charge rounds half-up to cents before summing. Blank optional amounts contribute zero.");
  line("Freight, NTE, AM and specialized price fields are excluded pending clarification. Saved order values do not represent confirmed invoices or payment received.");
  if ([...JSON.stringify(result)].some(char => !supported.has(char.codePointAt(0)!))) line("Characters outside the print font are preserved as Unicode codes, for example \\u{1f600}.");
  if (result.rows.length) { next(); line("Order Details", true); }
  for (const row of result.rows) {
    if (y < 210) { next(); line("Order Details (continued)", true); }
    line(`${row.number} - ${row.name}`, true);
    for (const [label, value] of [["Date Entered", row.date], ["Invoice To", row.customer], ["Status", row.status], ["Division", row.division], ["Job Type", row.jobType], ["Scheduled Job Date", row.scheduled], ["Assigned To", row.assigned], ...(filter.kind === "products" ? [["Matching Product Total", money(row.matching)]] : []), ["Order Subtotal", money(row.subtotal)], ["Review", row.issues.join("; ")]]) line(`${label}: ${value || "—"}`);
    y -= 12;
  }
  doc.getPages().forEach((sheet, index) => {
    sheet.drawLine({ start: { x: 48, y: 40 }, end: { x: 564, y: 40 }, thickness: .4, color: rule });
    sheet.drawText(`Carts and Parts Operations | ${generated} CT`, { x: 48, y: 26, font, size: 7, color: ink });
    const number = `Page ${index + 1} of ${doc.getPageCount()}`;
    sheet.drawText(number, { x: 564 - font.widthOfTextAtSize(number, 7), y: 26, font, size: 7, color: ink });
  });
  return doc.save();
}
