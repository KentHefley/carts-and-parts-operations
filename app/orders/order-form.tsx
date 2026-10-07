"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { orderFields } from "../../lib/order-fields";
import { ItemValue, OrderView } from "../../lib/order-types";
import { persistOrder } from "./actions";

const sections = ["Order Overview", "Billing and Store Information", "Items and Pricing", "Additional Information", "Completion", "Service and Labor"];
export function OrderForm({ initial }: { initial: OrderView }) {
  const [fields, setFields] = useState(initial.fields);
  const [items, setItems] = useState(initial.items);
  const [feedback, setFeedback] = useState(initial.fields.name ? "Saved" : "Enter Name to save");
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState(initial);
  const saved = useRef(initial);
  const latest = useRef({ fields, items });
  const saving = useRef(false);
  const blocked = useRef(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(baseline.fields) || JSON.stringify(items) !== JSON.stringify(baseline.items);

  const save = useCallback(async () => {
    if (saving.current || blocked.current) return;
    const snapshot = latest.current;
    const patch = Object.fromEntries(Object.entries(snapshot.fields).filter(([key, value]) => value !== (saved.current.fields[key] ?? "")));
    const itemsChanged = JSON.stringify(snapshot.items) !== JSON.stringify(saved.current.items);
    if (!Object.keys(patch).length && !itemsChanged) return;
    if (!snapshot.fields.name?.trim()) { setFeedback("Name is required before saving"); return; }
    saving.current = true; setBusy(true); setFeedback("Saving…");
    try {
      const result = await persistOrder({ id: initial.id, base: saved.current.fields, patch, ...(itemsChanged ? { items: snapshot.items, baseItems: saved.current.items } : {}) });
      if (!result.ok) {
        blocked.current = true; setConflict(true); setFeedback(result.message + (result.conflict ? ` (${result.conflict.map(key => orderFields.find(field => field.key === key)?.label ?? key).join(", ")})` : ""));
      } else {
        saved.current = result.order;
        setBaseline(result.order);
        // Preserve typing that occurred while the request was in flight.
        setFields(current => Object.fromEntries(Object.entries({ ...result.order.fields, ...current }).map(([key, value]) => [key, value === (snapshot.fields[key] ?? "") ? (result.order.fields[key] ?? "") : value])));
        setItems(current => JSON.stringify(current) === JSON.stringify(snapshot.items) ? result.order.items : current);
        setFeedback("Saved");
      }
    } catch { blocked.current = true; setConflict(true); setFeedback("Couldn’t save. Your input is still here. Retry when the connection returns."); }
    finally { saving.current = false; setBusy(false); }
  }, [initial.id]);

  useEffect(() => {
    latest.current = { fields, items };
    if (!conflict) { const timer = setTimeout(() => { void save(); }, 700); return () => clearTimeout(timer); }
  }, [fields, items, conflict, save, busy]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(key: string, value: string) { setFields(current => ({ ...current, [key]: value })); if (!conflict) setFeedback("Unsaved changes"); }
  function updateItem(index: number, key: keyof ItemValue, value: string) { setItems(current => current.map((item, position) => position === index ? { ...item, [key]: value } : item)); if (!conflict) setFeedback("Unsaved changes"); }

  return <main className="order-page">
    <header className="order-header"><div><p className="development-label">Development</p><h1>{initial.number} · {fields.name || "New Sales Order"}</h1></div>
      <Link href="/" onClick={event => { if (dirty || saving.current) { event.preventDefault(); setFeedback("Save pending changes before returning to Sales Orders."); } }}>Sales Orders</Link>
    </header>
    <div className="save-toolbar"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Order Details</button><span aria-live="polite" role="status">{feedback}</span><button disabled={busy || conflict} onClick={() => void save()}>Save now</button></div>
    {conflict && <div className="save-alert" role="alert"><p>{feedback}</p><button onClick={() => { blocked.current = false; setConflict(false); void save(); }}>Retry save</button><button onClick={() => { if (window.confirm("Reload saved values? Your unsaved input will be discarded.")) window.location.reload(); }}>Reload saved values</button></div>}
    <form onSubmit={event => { event.preventDefault(); void save(); }} onBlur={() => { void save(); }}>
      {sections.map(section => <details key={section} className="form-section" open={section !== "Service and Labor"}><summary>{section}</summary><div className="field-grid">
        {section === "Order Overview" && <>
          <label>Name <span aria-label="required">*</span><input name="name" value={fields.name ?? ""} onChange={event => update("name", event.target.value)} required /></label>
          <label>SO Number<input value={initial.number} readOnly /></label>
          <label>Date Entered<input type="date" value={fields.dateEntered ?? ""} onChange={event => update("dateEntered", event.target.value)} /></label>
          <label>Submitted By<input value={initial.creator} readOnly /></label>
          <div><span>Status</span><details className="status-picker"><summary className={`status-box status-${fields.status?.replaceAll(" ", "-")}`}>{fields.status}</summary>{["Pending", "In Progress", "Expedite"].map(status => <button type="button" key={status} onClick={event => { update("status", status); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{status}</button>)}</details></div>
        </>}
        {orderFields.filter(field => field.section === section).map(field => <label key={field.key}>{field.label}
          {field.options ? <select value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)}><option value="">—</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
            : field.type === "textarea" ? <textarea value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} />
              : <input type={field.type} step={field.type === "number" ? "any" : undefined} value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} />}
        </label>)}
      </div>
      {section === "Items and Pricing" && <div className="item-rows">{items.map((item, index) => <fieldset key={index}><legend>Item {index + 1}</legend><label>Quantity<input inputMode="decimal" value={item.quantity} onChange={event => updateItem(index, "quantity", event.target.value)} /></label><label>Description<input value={item.description} onChange={event => updateItem(index, "description", event.target.value)} /></label><label>Unit Price<input inputMode="decimal" value={item.unitPrice} onChange={event => updateItem(index, "unitPrice", event.target.value)} /></label></fieldset>)}<button type="button" onClick={() => { setItems(current => [...current, { description: "", quantity: "", unitPrice: "" }]); if (!conflict) setFeedback("Unsaved changes"); }}>+ Add Item</button></div>}
      </details>)}
    </form>
  </main>;
}
