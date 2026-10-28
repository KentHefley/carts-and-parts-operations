"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { blackoutDateLabel, blackoutsInRange, validateBlackout, type CalendarBlackout } from "../../lib/calendar-blackout-model";
import { saveBlackout } from "./actions";
import { DateField } from "../orders/date-field";
import { ConfirmationDialog } from "../ui/confirmation-dialog";

const rangeLabel = (row: { start: string; end: string }) => row.start === row.end ? blackoutDateLabel(row.start) : `${blackoutDateLabel(row.start)} – ${blackoutDateLabel(row.end)}`;
export function BlackoutNotices({ rows, from, to }: { rows: CalendarBlackout[]; from: string; to: string }) {
  const visible = blackoutsInRange(rows, from, to);
  if (!visible.length) return null;
  return <section className="calendar-blackout-notices" aria-label="Vacation blackout notices"><h2>Vacation Blackout</h2><p>Plan vacations outside these busy periods. These notices do not block time-off entries.</p><ul>{visible.map(row => <li key={row.id}><strong>{rangeLabel(row)}</strong> · {row.reason}</li>)}</ul></section>;
}
export function BlackoutSettings({ rows }: { rows: CalendarBlackout[] }) {
  const [editing, setEditing] = useState<CalendarBlackout | "new" | null>(null);
  const [message, setMessage] = useState("");
  return <section aria-labelledby="blackout-settings-heading"><header><h2 id="blackout-settings-heading">Vacation Blackouts</h2><button type="button" onClick={() => { setMessage(""); setEditing("new"); }}>Add Blackout Dates</button></header><p className="screen-caption">Super Admin only. Both dates are included. Notices stay visible when filtering by person; time off is still allowed.</p>
    {rows.length ? <ul className="calendar-blackout-settings-list">{rows.map(row => <li key={row.id}><div><strong>{rangeLabel(row)}</strong><p>{row.reason}</p></div><button type="button" aria-label={`Edit blackout ${rangeLabel(row)}`} onClick={() => { setMessage(""); setEditing(row); }}>Edit</button></li>)}</ul> : <p>No vacation blackout dates have been added.</p>}
    {message && <p role="status">{message}</p>}
    {editing && <BlackoutEditor key={editing === "new" ? "new" : editing.id} row={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSaved={removed => { setEditing(null); setMessage(removed ? "Blackout deleted." : "Blackout saved."); }} />}
  </section>;
}
function BlackoutEditor({ row, onClose, onSaved }: { row?: CalendarBlackout; onClose: () => void; onSaved: (removed: boolean) => void }) {
  const router = useRouter(), titleId = useId(), modal = useRef<HTMLDialogElement>(null), working = useRef(false);
  const [id] = useState(() => row?.id ?? crypto.randomUUID());
  const [details, setDetails] = useState({ start: row?.start ?? "", end: row?.end ?? "", reason: row?.reason ?? "" });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, element = modal.current!;
    element.showModal();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  async function submit(remove = false) {
    if (working.current) return;
    setError("");
    if (!remove) { try { validateBlackout(details); } catch (error) { setError(error instanceof Error ? error.message : "Check the blackout dates and reason."); return; } }
    working.current = true; setBusy(true);
    try {
      const result = await saveBlackout({ id, revision: row?.revision ?? null, details, remove });
      if (!result.ok) { setError(result.message); setConfirmDelete(false); return; }
      onSaved(remove); router.refresh();
    } catch { setError("Could not confirm saving. Your input is preserved. Retry before closing."); setConfirmDelete(false); }
    finally { working.current = false; setBusy(false); }
  }
  return <><dialog className="calendar-dialog" ref={modal} aria-labelledby={titleId} aria-busy={busy} onCancel={event => { event.preventDefault(); if (!working.current) onClose(); }}><header><h2 id={titleId}>{row ? "Edit Vacation Blackout" : "Add Vacation Blackout"}</h2><button type="button" disabled={busy} onClick={onClose}>Close</button></header><form onSubmit={event => { event.preventDefault(); void submit(); }}><p>Notice only. Existing and new time-off entries are allowed.</p><fieldset disabled={busy} className="calendar-blackout-fields"><legend>Blackout range and reason</legend><label>First day<DateField label="Blackout first day" value={details.start} onChange={start => setDetails(previous => ({ ...previous, start }))} /></label><label>Last day (included)<DateField label="Blackout last day" value={details.end} onChange={end => setDetails(previous => ({ ...previous, end }))} /></label><label className="calendar-blackout-reason">Reason<textarea required maxLength={500} value={details.reason} onChange={event => setDetails(previous => ({ ...previous, reason: event.target.value }))} /></label></fieldset>{error && <p role="alert" className="report-warning">{error}</p>}<div className="calendar-dialog-actions"><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Blackout"}</button>{row && <button className="danger-button" type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete Blackout</button>}</div></form></dialog>{confirmDelete && <ConfirmationDialog title="Delete vacation blackout?" description="This removes the calendar notice and shading. It does not delete any time-off events. The change remains in audit history." confirmLabel="Delete Blackout" onConfirm={() => void submit(true)} onCancel={() => setConfirmDelete(false)} busy={busy} />}</>;
}
