"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type ChoiceRow, choiceFields } from "../../../lib/order-choice-policy";
import { ConfirmationDialog } from "../../ui/confirmation-dialog";
import { saveChoice } from "./actions";

export function ChoiceSettings({ rows }: { rows: ChoiceRow[] }) {
  return <div className="choice-settings">{choiceFields.map(field => <ChoiceSection key={field.key} field={field} rows={rows.filter(row => row.fieldKey === field.key)} />)}</div>;
}
function ChoiceSection({ field, rows }: { field: { key: string; label: string }; rows: ChoiceRow[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deactivate, setDeactivate] = useState<ChoiceRow | null>(null);
  async function save(input: Parameters<typeof saveChoice>[0]) {
    if (busy) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const result = await saveChoice(input);
      if (result.error) { setError(result.error); return; }
      setMessage("Choice saved.");
      if ("fieldKey" in input) setLabel("");
      setDeactivate(null);
      router.refresh();
    } catch { setError("The result is unknown. Reload to review saved choices before trying again."); }
    finally { setBusy(false); }
  }
  const activeRows = rows.filter(row => row.active);
  const move = (row: ChoiceRow, index: number, direction: "up" | "down") => {
    const neighbor = activeRows[index + (direction === "up" ? -1 : 1)];
    if (neighbor) void save({ id: row.id, version: row.version, direction, neighborId: neighbor.id, neighborVersion: neighbor.version });
  };
  const renderRow = (row: ChoiceRow, index: number) => <li key={row.id}><div><strong>{row.label}</strong><span>{row.active ? "Active" : "Inactive"}</span></div><div className="choice-row-actions">
    {row.active && <><button type="button" disabled={busy || index === 0} aria-label={`Move ${field.label}: ${row.label} up`} onClick={() => move(row, index, "up")}>Move Up</button><button type="button" disabled={busy || index === activeRows.length - 1} aria-label={`Move ${field.label}: ${row.label} down`} onClick={() => move(row, index, "down")}>Move Down</button></>}
    <button type="button" disabled={busy} aria-label={`${row.active ? "Deactivate" : "Reactivate"} ${field.label}: ${row.label}`} onClick={() => row.active ? setDeactivate(row) : void save({ id: row.id, active: true, version: row.version })}>{row.active ? "Deactivate" : "Reactivate"}</button></div></li>;
  return <section className="content-panel choice-section" aria-label={`${field.label} choices`}>
    <h2>{field.label}</h2>
    <form className="choice-add" onSubmit={event => { event.preventDefault(); void save({ fieldKey: field.key, label }); }}>
      <label>New {field.label} choice<input value={label} maxLength={100} required disabled={busy} onChange={event => setLabel(event.target.value)} /></label>
      <button className="primary-button" type="submit" disabled={busy || !label.trim()}>Add Choice</button>
    </form>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p className="screen-caption">Use Move Up and Move Down to set the order shown in sales orders.</p>
    <ul className="choice-list">{activeRows.map(renderRow)}</ul>
    {!rows.some(row => row.active) && <p>No active choices. Orders can still leave this field blank.</p>}
    {rows.some(row => !row.active) && <details><summary>Inactive choices ({rows.filter(row => !row.active).length})</summary><ul className="choice-list">{rows.filter(row => !row.active).map(renderRow)}</ul></details>}
    {deactivate && <ConfirmationDialog title={`Deactivate ${deactivate.label}?`} description="This removes the choice from new selections. Existing order values and history are retained. You can reactivate it later." confirmLabel="Deactivate Choice" busy={busy} onCancel={() => setDeactivate(null)} onConfirm={() => void save({ id: deactivate.id, active: false, version: deactivate.version })} />}
  </section>;
}
