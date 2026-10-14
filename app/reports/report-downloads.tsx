"use client";
import { useState } from "react";
import type { ReportFilter } from "../../lib/report-model";
export function ReportDownloads({ filter }: { filter: ReportFilter }) {
  const [busy, setBusy] = useState(""), [error, setError] = useState("");
  async function download(format: string) {
    if (busy) return;
    setBusy(format); setError("");
    try {
      const response = await fetch(`/reports/export?${new URLSearchParams({ ...filter, format })}`, { cache: "no-store" });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || "Download failed. Retry later."); }
      if (!response.headers.get("content-disposition")?.startsWith("attachment;")) throw new Error("Please sign in again, then retry the download.");
      const url = URL.createObjectURL(await response.blob()), link = document.createElement("a");
      link.href = url; link.download = `${filter.kind}-${filter.from}-to-${filter.to}.${format}`; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Download failed. Retry later."); }
    finally { setBusy(""); }
  }
  return <section className="content-panel" aria-label="Report downloads"><div className="book-actions">{[["xlsx", "Excel"], ["csv", "CSV"], ["pdf", "PDF"]].map(([format, label]) => <button key={format} disabled={!!busy} onClick={() => void download(format)}>{busy === format ? "Preparing…" : `Download ${label}`}</button>)}</div><p className="screen-caption">Downloads use these filters and the latest saved values for all matches. If an order changes after this screen loads, rerun the report to compare. Large PDFs may require a narrower range.</p>{error && <p role="alert" className="report-warning">{error}</p>}<span className="screen-caption" role="status">{busy ? "Preparing report download…" : ""}</span></section>;
}
