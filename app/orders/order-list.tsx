"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { activeStatuses, terminalStatuses } from "../../lib/order-status";
import type { ListOperation, ListOperationResult } from "../../lib/order-list-operation";
import { applyOrderListAction } from "./list-actions";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
type Row = { id: string; number: string; name: string; status: string; division: string; jobType: string; scheduled: string; assigned: string; canDelete: boolean };
type Outcome = { id: string; number: string; result: ListOperationResult };
export function OrderList({ orders, completed = false, admin = false }: { orders: Row[]; completed?: boolean; admin?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const working = useRef(false);
  const copyKeys = useRef(new Map<string, string>());
  const rows = orders.filter(order => order.name.toLowerCase().includes(name.toLowerCase()) && order.number.toLowerCase().includes(number.toLowerCase()) && (!status || order.status === status));
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

  async function run(operation: ListOperation) {
    if (working.current || !maySelect || !selectedRows.length || (completed && operation === "copy") || (operation === "trash" && !mayTrash)) return;
    working.current = true; setBusy(true); setOutcomes([]);
    const batch = [...selectedRows];
    const results: Outcome[] = [];
    try {
      for (const [index, order] of batch.entries()) {
        setProgress(`${operation === "copy" ? "Copying" : "Moving to Trash"} ${index + 1} of ${batch.length}: ${order.number}. Keep this page open.`);
        if (operation === "copy" && !copyKeys.current.has(order.id)) copyKeys.current.set(order.id, crypto.randomUUID());
        let result: ListOperationResult;
        try { result = await applyOrderListAction(operation, order.id, operation === "copy" ? copyKeys.current.get(order.id) : undefined); }
        catch { result = { ok: false, message: "The result is unknown. Retry the selected order on this page before leaving." }; }
        results.push({ id: order.id, number: order.number, result });
        setOutcomes([...results]);
        if (result.ok) {
          setSelected(current => current.filter(id => id !== order.id));
          if (operation === "copy") copyKeys.current.delete(order.id);
        }
      }
      const succeeded = results.filter(outcome => outcome.result.ok).length;
      setProgress(`${succeeded} of ${batch.length} orders ${operation === "copy" ? "copied" : "moved to Trash"}.${succeeded < batch.length ? " Failed orders remain selected for retry." : ""}`);
      router.refresh();
    } finally { working.current = false; setBusy(false); setConfirmTrash(false); }
  }

  return <>
    <div className="list-filters">
      <label className="name-filter">Search by Name<input disabled={busy} value={name} onChange={event => { setName(event.target.value); setSelected([]); }} /></label>
      <label>SO Number<input disabled={busy} value={number} onChange={event => { setNumber(event.target.value); setSelected([]); }} /></label>
      <label>Status<select disabled={busy} value={status} onChange={event => { setStatus(event.target.value); setSelected([]); }}><option value="">{completed ? "All completed statuses" : "All active statuses"}</option>{(completed ? terminalStatuses : activeStatuses).map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    {maySelect && selectedRows.length > 0 && <div className="selection-toolbar" role="region" aria-label="Selected order actions" aria-busy={busy}>
      <strong>{selectedRows.length} selected</strong>
      {!completed && <button type="button" className="primary-button" disabled={busy} onClick={() => void run("copy")}>Copy Selected</button>}
      <button type="button" className="danger-button" disabled={busy || !mayTrash} aria-describedby={!mayTrash ? "selection-permission" : undefined} onClick={() => { setTrashCount(selectedRows.length); setConfirmTrash(true); }}>Move Selected to Trash</button>
      <button type="button" disabled={busy} onClick={() => setSelected([])}>Clear Selection</button>
      {!mayTrash && <p id="selection-permission">Only creators or admins can delete orders. Select only orders you may delete to use Move Selected to Trash.</p>}
      {!completed && <small>Copies use the latest saved order details. Unsaved changes in another tab are not included.</small>}
    </div>}
    <p className="selection-progress" role="status" aria-live="polite">{progress}</p>
    {outcomes.length > 0 && <section className="selection-results" aria-label="Order action results"><h2>Action results</h2><ul>{outcomes.map(outcome => <li key={outcome.id}>
      <strong>{outcome.number}</strong>: {outcome.result.ok
        ? outcome.result.copied ? <>Copied as <Link href={`/orders/${outcome.result.copied.id}`}>{outcome.result.copied.number}</Link></> : "Moved to Trash. Admins can restore it within 30 days."
        : outcome.result.message}
    </li>)}</ul>{!busy && <button type="button" onClick={() => { setOutcomes([]); setProgress(""); }}>Dismiss</button>}</section>}
    {confirmTrash && <ConfirmationDialog title={`Move ${trashCount} ${trashCount === 1 ? "order" : "orders"} to Trash?`} description="Only an admin can restore these orders within 30 days. Their files will be retained during that period. Each order's result will be shown below the selection controls." confirmLabel="Move Selected to Trash" busy={busy} onCancel={() => setConfirmTrash(false)} onConfirm={() => void run("trash")} />}
    <div className="table-scroll"><table><thead><tr>
      {maySelect && <th scope="col" className="selection-cell"><input type="checkbox" aria-label="Select all displayed orders" checked={allSelected} disabled={busy || !rows.length} ref={input => { if (input) input.indeterminate = selectedRows.length > 0 && !allSelected; }} onChange={event => setSelected(event.target.checked ? rows.map(order => order.id) : [])} /></th>}
      {["SO Number", "Name", "Status", "Division", "Job Type", "Scheduled Job Date", "Assigned To"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(order => <tr key={order.id} data-selected={selected.includes(order.id) || undefined}>
        {maySelect && <td className="selection-cell"><input type="checkbox" aria-label={`Select ${order.number}`} checked={selected.includes(order.id)} disabled={busy} onChange={event => setSelected(current => event.target.checked ? [...current, order.id] : current.filter(id => id !== order.id))} /></td>}
        <td><Link href={`/orders/${order.id}`}>{order.number}</Link></td><td><Link href={`/orders/${order.id}`}>{order.name}</Link></td><td><span className={`status-box status-${order.status.replaceAll(" ", "-")}`}>{order.status}</span></td><td>{order.division || "—"}</td><td>{order.jobType || "—"}</td><td>{order.scheduled || "—"}</td><td>{order.assigned || "—"}</td></tr>)}</tbody></table></div>
    {!rows.length && <p className="empty-message">{completed ? "No completed or voided orders match." : "No saved orders match. Choose New Order to begin."}</p>}
  </>;
}
