"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { customTypes, formSections, typeLabels, type FieldLayout, type LayoutField } from "../../../lib/custom-field-model";
import { CustomFieldInput } from "../../orders/custom-field-input";
import { ConfirmationDialog } from "../../ui/confirmation-dialog";
import { deleteField, reviewDeleteField, saveFields } from "./actions";

export function FieldSettings({ initial }: { initial: FieldLayout }) {
  const [saved, setSaved] = useState(initial), [draft, setDraft] = useState(initial);
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(false), [message, setMessage] = useState("");
  const [review, setReview] = useState<{ key: string; count: number; token: string; label: string } | null>(null);
  const [busy, startTransition] = useTransition();
  const editorHeading = useRef<HTMLHeadingElement>(null), previewHeading = useRef<HTMLHeadingElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const [editRequest, setEditRequest] = useState(0), [previewRequest, setPreviewRequest] = useState(0);
  useEffect(() => {
    if (!editRequest) return;
    editorHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    editorHeading.current?.focus({ preventScroll: true });
  }, [editRequest]);
  useEffect(() => {
    if (!previewRequest) return;
    previewHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    previewHeading.current?.focus({ preventScroll: true });
  }, [previewRequest]);
  useEffect(() => {
    if (!message) return;
    status.current?.scrollIntoView({ block: "start", behavior: "instant" });
    status.current?.focus({ preventScroll: true });
  }, [message]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const field = draft.fields.find(field => field.key === selected && !field.deleted);
  function selectField(key: string) { setSelected(key); setEditRequest(current => current + 1); }
  function showPreview() { setPreview(true); setPreviewRequest(current => current + 1); }
  function persist() { startTransition(async () => { try { const result = await saveFields(draft); if (result.layout) accept(result.layout); else setMessage(result.error ?? "Could not save."); } catch { setMessage("Could not save. Your draft is preserved."); } }); }
  function edit(patch: Partial<LayoutField>) { setDraft(current => ({ ...current, fields: current.fields.map(field => field.key === selected ? { ...field, ...patch } : field) })); setPreview(false); setMessage(""); }
  function move(key: string, direction: number) {
    const rows = [...draft.fields], index = rows.findIndex(field => field.key === key), source = rows[index];
    const neighbors = rows.map((field, index) => ({ field, index })).filter(row => row.field.section === source.section && !row.field.deleted);
    const neighbor = neighbors[neighbors.findIndex(row => row.field.key === key) + direction];
    if (!neighbor) return;
    [rows[index], rows[neighbor.index]] = [rows[neighbor.index], rows[index]];
    setDraft({ ...draft, fields: rows }); setPreview(false); setMessage("");
  }
  function accept(layout: FieldLayout) { setSaved(layout); setDraft(layout); setSelected(""); setPreview(false); setMessage("Field settings saved."); }
  return <>
    <p ref={status} tabIndex={-1} className="field-settings-heading" role="status" aria-live="polite">{message || (dirty ? "Unsaved changes. Review & Save to apply them, including activation changes." : "Settings saved")}</p>
    <fieldset disabled={busy} className="field-settings-controls"><div className="assignment-actions"><button type="button" className="primary-button" onClick={() => {
      const key = `custom_${crypto.randomUUID()}`;
      setDraft(current => ({ ...current, fields: [...current.fields, { key, label: "New Field", section: formSections[0], type: "text", help: "", options: [], active: true, custom: true, used: false, revision: 1 }] })); selectField(key); setPreview(false); setMessage("");
    }}>Add Sales Order Field</button><button type="button" onClick={showPreview}>Preview Layout</button><button type="button" disabled={!dirty} onClick={() => { if (preview) persist(); else showPreview(); }}>{preview ? "Save Layout" : "Review & Save"}</button><button type="button" disabled={!dirty} onClick={() => { setDraft(saved); setSelected(""); setPreview(false); setMessage(""); }}>Discard Changes</button></div>
    {field && <section className="content-panel"><h2 ref={editorHeading} tabIndex={-1} className="field-settings-heading">Edit {field.label}</h2><div className="field-grid"><label>Label<input maxLength={100} value={field.label} onChange={event => edit({ label: event.target.value })} /></label><label>Help text<input maxLength={500} value={field.help} onChange={event => edit({ help: event.target.value })} /></label><label>Type<select disabled={!field.custom || field.used} value={field.type} onChange={event => edit({ type: event.target.value, options: [] })}>{!customTypes.includes(field.type as typeof customTypes[number]) && <option value={field.type}>{field.type}</option>}{customTypes.map(type => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label><label>Section<select disabled={!field.custom} value={field.section} onChange={event => edit({ section: event.target.value })}>{formSections.map(section => <option key={section}>{section}</option>)}</select></label>{field.custom && field.type === "select" && <label>Choices (one per line)<textarea value={field.options.join("\n")} onChange={event => edit({ options: event.target.value.split("\n") })} /></label>}</div>{field.used && <p>This field has saved values. Create a replacement to use a different type.</p>}{!field.custom && <p>Core field behavior is protected. Manage Terms, Freight-Shipping, Job Type and Division choices in Dropdown Choices.</p>}{field.custom && <div className="assignment-actions"><button type="button" onClick={() => edit({ active: !field.active })}>{field.active ? "Deactivate" : "Reactivate"}</button><button type="button" className="primary-button" disabled={!dirty} onClick={() => { if (preview) persist(); else showPreview(); }}>{preview ? "Save Layout" : "Review & Save"}</button><button type="button" className="danger-button" disabled={dirty} onClick={() => startTransition(async () => { try { const result = await reviewDeleteField(field.key); if (result.review) setReview({ ...result.review, key: field.key }); else setMessage(result.error ?? "Could not review deletion."); } catch { setMessage("Could not review deletion."); } })}>Delete Field</button></div>}{field.custom && dirty && <small>Save or discard layout changes before reviewing permanent deletion.</small>}</section>}
    {formSections.map(section => <section className="content-panel" key={section}><h2>{section}</h2><ol className="field-layout-list">{draft.fields.filter(field => field.section === section && !field.deleted).map((field, index, rows) => <li key={field.key}><span><strong>{field.label}</strong> · {typeLabels[field.type] || field.type}{!field.custom ? " · Core" : ""}{!field.active ? " · Inactive" : ""}</span><div><button type="button" onClick={() => selectField(field.key)}>Edit<span className="sr-only"> {field.label}</span></button><button type="button" disabled={index === 0} aria-label={`Move ${field.label} up`} onClick={() => move(field.key, -1)}>↑</button><button type="button" disabled={index === rows.length - 1} aria-label={`Move ${field.label} down`} onClick={() => move(field.key, 1)}>↓</button></div></li>)}</ol></section>)}
    </fieldset>
    {preview && <section className="content-panel" aria-label="Form layout preview"><h2 ref={previewHeading} tabIndex={-1} className="field-settings-heading">Form Layout Preview</h2><p>Review these pending changes, then save to apply them. Inactive fields are omitted below. Sample input is not saved to any order.</p><button type="button" className="primary-button" disabled={!dirty || busy} onClick={persist}>{busy ? "Saving…" : "Save Layout"}</button>{formSections.map(section => <section key={section}><h3>{section}</h3><fieldset disabled><div className="field-grid">{draft.fields.filter(field => field.active && !field.deleted && field.section === section).map(field => field.custom ? <CustomFieldInput key={field.key} field={field} value="" users={[]} onChange={() => {}} /> : <label key={field.key}>{field.label}<input readOnly value={field.key === "status" ? "In Progress" : ""} />{field.help && <small>{field.help}</small>}</label>)}</div></fieldset></section>)}</section>}
    {review && <ConfirmationDialog title={`Delete ${review.label}?`} description={`This permanently removes current values from ${review.count} orders, including any in Trash. Labeled audit revisions remain. This cannot be restored.`} confirmLabel="Delete Field Permanently" busy={busy} onCancel={() => setReview(null)} onConfirm={() => startTransition(async () => { try { const result = await deleteField(review.key, review.token); if (result.layout) { accept(result.layout); setSelected(""); setReview(null); setMessage("Custom field deleted. History retained."); } else { setMessage(result.error ?? "Could not delete."); setReview(null); } } catch { setMessage("Could not delete. Review saved settings before retrying."); setReview(null); } })} />}
  </>;
}
