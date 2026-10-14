import { requireAdmin } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { chicagoDate } from "../../lib/order-types";
import { reportFilter } from "../../lib/report-model";
import { loadReport } from "../../lib/report-store";
import { AuthenticatedShell } from "../ui/authenticated-shell";
import { ReportFilters } from "./report-filters";
import { ReportResults } from "./report-results";
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireAdmin(), params = await searchParams, today = chicagoDate();
  const value = (key: string, fallback = "") => typeof params[key] === "string" ? params[key] as string : fallback;
  let filter: ReturnType<typeof reportFilter> | undefined, result: Awaited<ReturnType<typeof loadReport>> | undefined, error = "";
  if (params.run) {
    try { filter = reportFilter(params); } catch (caught) { error = caught instanceof Error ? caught.message : "Check report filters."; }
    if (filter) {
      try { result = await loadReport(getDatabase(), actor.id, filter); }
      catch (caught) { error = caught instanceof Error && caught.message.startsWith("More than 5,000") ? caught.message : "Report unavailable. Retry later; no partial totals are shown."; }
    }
  }
  const page = /^\d{1,6}$/.test(value("page")) ? Math.max(1, Number(value("page"))) : 1;
  return <AuthenticatedShell title="Reports" active="Reports" admin><main className="screen-page reports-screen"><div className="screen-heading"><div><h1>Reports</h1><p className="screen-caption">Saved sales order values · Administrator access</p></div></div>
    <ReportFilters key={JSON.stringify([params.kind, params.from, params.to, params.query])} kind={["sales", "products", "customer"].includes(value("kind")) ? value("kind") : "sales"} from={value("from", `${today.slice(0, 7)}-01`)} to={value("to", today)} query={value("query")} />
    {error && <p role="alert" className="report-warning">{error}</p>}
    {result && filter ? <ReportResults result={result} filter={filter} page={page} /> : !error && <p>Choose a report and Date Entered range, then select Run Report. Product and customer searches use case-insensitive contains matching.</p>}
  </main></AuthenticatedShell>;
}
