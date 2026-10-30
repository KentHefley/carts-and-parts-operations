"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { activeStatuses, statusLabel, terminalStatuses } from "../../lib/order-status";
import type { ListOperation, ListOperationResult } from "../../lib/order-list-operation";
import { applyOrderListAction } from "./list-actions";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import type { BoardPage, BoardRow } from "../../lib/order-board-model";
import { useOrderBoard } from "./use-order-board";
type Outcome = BoardRow & { result: ListOperationResult };
function BoardValue({ value, href }: { value: string; href?: string }) {
  const text = <span className="board-value-text">{value || "—"}</span>;
  return href ? <Link prefetch={false} className="board-value" data-full-value={value || undefined} title={value} href={href}>{text}</Link>
    : <span className="board-value" tabIndex={value ? 0 : undefined} data-full-value={value || undefined} title={value || undefined}>{text}</span>;
}
export function OrderList({ initialPage, completed = false, admin = false }: { initialPage: BoardPage; completed?: boolean; admin?: boolean }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [lastOperation, setLastOperation] = useState<ListOperation>("copy");
  const working = useRef(false);
  const copyKeys = useRef(new Map<string, string>());
  const board = useOrderBoard(initialPage, { completed, name, number, status }, busy || confirmTrash);
  const rows = board.rows;
  const [selectionRows, setSelectionRows] = useState(rows);
  if (selectionRows !== rows) {
    setSelectionRows(rows);
    setSelected(current => current.filter(id => rows.some(row => row.id === id)));
  }
  const tableScroll = useRef<HTMLDivElement>(null);
  const selectedRows = rows.filter(order => selected.includes(order.id));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const mayTrash = selectedRows.length > 0 && selectedRows.every(order => order.canDelete);
  const maySelect = !completed || admin;
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const protect = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", protect, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", protect, true); };
  }, [busy]);

  async function run(operation: ListOperation, retryRows?: BoardRow[]) {
    const batch = [...(retryRows ?? selectedRows)];
    if (working.current || !maySelect || !batch.length || (completed && operation === "copy") || (operation === "trash" && !batch.every(row => row.canDelete))) return;
    working.current = true; setBusy(true); setOutcomes([]); setLastOperation(operation);
    const results: Outcome[] = [];
    try {
      for (const [index, order] of batch.entries()) {
        setProgress(`${operation === "copy" ? "Copying" : "Moving to Trash"} ${index + 1} of ${batch.length}: ${order.number}. Keep this page open.`);
        if (operation === "copy" && !copyKeys.current.has(order.id)) copyKeys.current.set(order.id, crypto.randomUUID());
        let result: ListOperationResult;
        try { result = await applyOrderListAction(operation, order.id, operation === "copy" ? copyKeys.current.get(order.id) : undefined); }
        catch { result = { ok: false, message: "The result is unknown. Use Retry Failed Orders on this page before leaving." }; }
        results.push({ ...order, result });
        setOutcomes([...results]);
        if (result.ok) {
          setSelected(current => current.filter(id => id !== order.id));
          if (operation === "copy") copyKeys.current.delete(order.id);
        }
      }
      const succeeded = results.filter(outcome => outcome.result.ok).length;
      setProgress(`${succeeded} of ${batch.length} orders ${operation === "copy" ? "copied" : "moved to Trash"}.${succeeded < batch.length ? " Failed orders remain in these results for retry." : ""}`);
    } finally { working.current = false; setBusy(false); setConfirmTrash(false); }
    await board.refresh();
  }

  return <>
    <div className="list-filters">
      <label className="name-filter">Search by Name<input maxLength={200} disabled={busy || confirmTrash} value={name} onChange={event => { setName(event.target.value); setSelected([]); if (tableScroll.current) tableScroll.current.scrollTop = 0; }} /></label>
      <label>SO Number<input maxLength={200} disabled={busy || confirmTrash} value={number} onChange={event => { setNumber(event.target.value); setSelected([]); if (tableScroll.current) tableScroll.current.scrollTop = 0; }} /></label>
      <label>Status<select disabled={busy || confirmTrash} value={status} onChange={event => { setStatus(event.target.value); setSelected([]); if (tableScroll.current) tableScroll.current.scrollTop = 0; }}><option value="">{completed ? "All completed statuses" : "All active statuses"}</option>{(completed ? terminalStatuses : activeStatuses).map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
    </div>
    {maySelect && selectedRows.length > 0 && <div className="selection-toolbar" role="region" aria-label="Selected order actions" aria-busy={busy}>
      <strong>{selectedRows.length} selected</strong>
      {!completed && <button type="button" className="primary-button" disabled={busy || !!board.pending} onClick={() => void run("copy")}>Copy Selected</button>}
      <button type="button" className="danger-button" disabled={busy || !!board.pending || !mayTrash} aria-describedby={!mayTrash ? "selection-permission" : undefined} onClick={() => { setTrashCount(selectedRows.length); setConfirmTrash(true); }}>Move Selected to Trash</button>
      <button type="button" disabled={busy} onClick={() => setSelected([])}>Clear Selection</button>
      {!mayTrash && <p id="selection-permission">Only creators or admins can delete orders. Select only orders you may delete to use Move Selected to Trash.</p>}
      {!completed && <small>Copies use the latest saved order details. Unsaved changes in another tab are not included.</small>}
    </div>}
    <p className="selection-progress" role="status" aria-live="polite">{progress}</p>
    {outcomes.length > 0 && <section className="selection-results" aria-label="Order action results"><h2>Action results</h2><ul>{outcomes.map(outcome => <li key={outcome.id}>
      <strong>{outcome.number}</strong>: {outcome.result.ok
        ? outcome.result.copied ? <>Copied as <Link href={`/orders/${outcome.result.copied.id}`}>{outcome.result.copied.number}</Link></> : "Moved to Trash. Admins can restore it within 30 days."
        : outcome.result.message}
    </li>)}</ul>{!busy && <>{outcomes.some(outcome => !outcome.result.ok) && <button type="button" disabled={!!board.pending || confirmTrash} onClick={() => void run(lastOperation, outcomes.filter(outcome => !outcome.result.ok))}>Retry Failed Orders</button>} <button type="button" onClick={() => { setOutcomes([]); setProgress(""); }}>Dismiss</button></>}</section>}
    {confirmTrash && <ConfirmationDialog title={`Move ${trashCount} ${trashCount === 1 ? "order" : "orders"} to Trash?`} description="Only an admin can restore these orders within 30 days. Their files will be retained during that period. Each order's result will be shown below the selection controls." confirmLabel="Move Selected to Trash" busy={busy} onCancel={() => setConfirmTrash(false)} onConfirm={() => void run("trash")} />}
    {board.error && <div className="board-error" role="alert">{board.error} <button type="button" disabled={busy || confirmTrash || !!board.pending} onClick={() => void board.refresh()}>Retry</button></div>}
    <div className="table-scroll order-board-scroll" ref={tableScroll} role="region" aria-label="Scrollable sales orders" tabIndex={0} aria-busy={board.searching || !!board.pending}><table className="order-board-table"><colgroup>
      {maySelect && <col className="board-select-col" />}<col className="board-number-col" /><col className="board-name-col" /><col className="board-status-col" /><col className="board-division-col" /><col className="board-job-col" /><col className="board-date-col" /><col className="board-assigned-col" />
    </colgroup><thead><tr>
      {maySelect && <th scope="col" className="selection-cell"><input type="checkbox" aria-label="Select all loaded orders" checked={allSelected} disabled={busy || !rows.length} ref={input => { if (input) input.indeterminate = selectedRows.length > 0 && !allSelected; }} onChange={event => setSelected(event.target.checked ? rows.map(order => order.id) : [])} /></th>}
      {["SO Number", "Name", "Status", "Division", "Job Type", "Scheduled Job Date", "Assigned To"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(order => <tr key={order.id} data-selected={selected.includes(order.id) || undefined}>
        {maySelect && <td className="selection-cell"><input type="checkbox" aria-label={`Select ${order.number}`} checked={selected.includes(order.id)} disabled={busy} onChange={event => setSelected(current => event.target.checked ? [...current, order.id] : current.filter(id => id !== order.id))} /></td>}
        <td><Link prefetch={false} href={`/orders/${order.id}`}>{order.number}</Link></td><td><BoardValue value={order.name} href={`/orders/${order.id}`} /></td><td><span className={`status-box status-${order.status.replaceAll(" ", "-")}`}>{statusLabel(order.status)}</span></td>{[order.division, order.jobType, order.scheduled, order.assigned].map((value, index) => <td key={index}><BoardValue value={value} /></td>)}</tr>)}</tbody></table></div>
    <div className="board-footer"><p role="status" aria-live="polite">{board.searching ? "Searching all saved orders…" : `Showing ${rows.length}${board.total === null ? "" : ` of ${board.total}`} matching orders`}{board.pending === "more" ? " · Loading more…" : board.pending === "refresh" ? " · Updating…" : ""}</p>{board.nextCursor && <button type="button" disabled={busy || confirmTrash || !!board.pending} onClick={() => void board.loadMore()}>Load More</button>}</div>
    {!rows.length && !board.searching && !board.error && <p className="empty-message">{completed ? "No completed or voided orders match." : "No saved orders match. Choose New Order to begin."}</p>}
  </>;
}
