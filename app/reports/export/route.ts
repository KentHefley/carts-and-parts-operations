import { requireAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { reportFilter } from "../../../lib/report-model";
import { loadReport } from "../../../lib/report-store";
import { reportCsv, reportExcel, reportPdf } from "../../../lib/report-export";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const actor = await requireAdmin(), url = new URL(request.url), format = url.searchParams.get("format");
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!["xlsx", "csv", "pdf"].includes(format ?? "")) return Response.json({ error: "Choose Excel, CSV or PDF." }, { status: 400, headers });
  let filter;
  try { filter = reportFilter(Object.fromEntries([...url.searchParams.keys()].map(key => { const values = url.searchParams.getAll(key); return [key, values.length > 1 ? values : values[0]]; }))); }
  catch { return Response.json({ error: "Invalid report filters. Run the report again before downloading." }, { status: 400, headers }); }
  try {
    const result = await loadReport(getDatabase(), actor.id, filter);
    const bytes = format === "csv" ? new TextEncoder().encode(reportCsv(result, filter)) : format === "xlsx" ? await reportExcel(result, filter) : await reportPdf(result, filter);
    return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf", "Content-Disposition": `attachment; filename="${filter.kind}-${filter.from}-to-${filter.to}.${format}"` } });
  } catch (error) {
    const message = error instanceof Error && /^(PDF |Excel |More than 5,000)/.test(error.message) ? error.message : "Download unavailable. Retry later; no partial report was generated.";
    return Response.json({ error: message }, { status: 422, headers });
  }
}
