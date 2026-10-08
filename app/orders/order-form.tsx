"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { orderFields } from "../../lib/order-fields";
import { AssignableUser, ItemValue, OrderView } from "../../lib/order-types";
import { persistOrder } from "./actions";
import { orderStatuses, terminalStatus } from "../../lib/order-status";
import { DateField } from "./date-field";
import { OrderTabs } from "./order-tabs";
import { sendSOEmail } from "./email-actions";
import { EmailToast } from "./email-toast";

const sections = ["Order Overview", "Billing and Store Information", "Items and Pricing", "Additional Information", "Completion", "Service and Labor"];
export function OrderForm({ initial, users, canSendEmail = false, pendingEmailId }: { initial: OrderView; users: AssignableUser[]; canSendEmail?: boolean; pendingEmailId?: string }) {
  const [fields, setFields] = useState(initial.fields);
  const [items, setItems] = useState(initial.items);
  const [assigneeIds, setAssigneeIds] = useState(initial.assigneeIds);
  const [feedback, setFeedback] = useState(initial.fields.name ? "Saved" : "Enter Name to save");
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState(initial);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailId, setEmailId] = useState(pendingEmailId);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
  const emailKey = useRef<string | undefined>(undefined);
  const sendingEmail = useRef(false);
  const saved = useRef(initial);
  const latest = useRef({ fields, items, assigneeIds });
  const saving = useRef(false);
  const blocked = useRef(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(baseline.fields) || JSON.stringify(items) !== JSON.stringify(baseline.items) || JSON.stringify(assigneeIds) !== JSON.stringify(baseline.assigneeIds);

  const save = useCallback(async () => {
    if (saving.current || blocked.current) return false;
    const snapshot = latest.current;
    const patch = Object.fromEntries(Object.entries(snapshot.fields).filter(([key, value]) => value !== (saved.current.fields[key] ?? "")));
    const itemsChanged = JSON.stringify(snapshot.items) !== JSON.stringify(saved.current.items);
    const assignmentsChanged = JSON.stringify(snapshot.assigneeIds) !== JSON.stringify(saved.current.assigneeIds);
    if (!snapshot.fields.name?.trim()) { setFeedback("Name is required before saving"); return false; }
    if (!Object.keys(patch).length && !itemsChanged && !assignmentsChanged) return true;
    saving.current = true; setBusy(true); setFeedback("Saving…");
    try {
      const result = await persistOrder({ id: initial.id, base: saved.current.fields, patch, ...(itemsChanged ? { items: snapshot.items, baseItems: saved.current.items } : {}), ...(assignmentsChanged ? { assigneeIds: snapshot.assigneeIds, baseAssigneeIds: saved.current.assigneeIds } : {}) });
      if (!result.ok) {
        blocked.current = true; setConflict(true); setFeedback(result.message + (result.conflict ? ` (${result.conflict.map(key => orderFields.find(field => field.key === key)?.label ?? key).join(", ")})` : ""));
        return false;
      } else {
        saved.current = result.order;
        setBaseline(result.order);
        // Preserve typing that occurred while the request was in flight.
        setFields(current => Object.fromEntries(Object.entries({ ...result.order.fields, ...current }).map(([key, value]) => [key, value === (snapshot.fields[key] ?? "") ? (result.order.fields[key] ?? "") : value])));
        setItems(current => JSON.stringify(current) === JSON.stringify(snapshot.items) ? result.order.items : current);
        setAssigneeIds(current => JSON.stringify(current) === JSON.stringify(snapshot.assigneeIds) ? result.order.assigneeIds : current);
        setFeedback("Saved");
        return true;
      }
    } catch { blocked.current = true; setConflict(true); setFeedback("Couldn’t save. Your input is still here. Retry when the connection returns."); return false; }
    finally { saving.current = false; setBusy(false); }
  }, [initial.id]);

  async function sendEmail() {
    if (sendingEmail.current || saving.current || blocked.current) return;
    sendingEmail.current = true; setEmailBusy(true); setToast(null);
    try {
      latest.current = { fields, items, assigneeIds };
      if (!await save()) { setToast({ message: "Save the order and resolve any conflicts before sending email.", success: false }); return; }
      emailKey.current ??= crypto.randomUUID();
      const result = await sendSOEmail(emailId ? { messageId: emailId } : { expected: saved.current, requestKey: emailKey.current });
      if (result.ok) { setEmailId(undefined); emailKey.current = undefined; }
      else if (result.messageId) setEmailId(result.messageId);
      setToast({ message: result.message, success: result.ok });
    } catch { setToast({ message: "The email result is unknown. Retry this attempt; your order remains saved.", success: false }); }
    finally { sendingEmail.current = false; setEmailBusy(false); }
  }

  useEffect(() => {
    latest.current = { fields, items, assigneeIds };
    if (!conflict) { const timer = setTimeout(() => { void save(); }, 3000); return () => clearTimeout(timer); }
  }, [fields, items, assigneeIds, conflict, save, busy]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const protectNavigation = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && !link.getAttribute("href")?.startsWith("#") && (dirty || saving.current)) {
        event.preventDefault(); event.stopPropagation();
        setFeedback("Save pending changes before leaving this order.");
      }
    };
    document.addEventListener("click", protectNavigation, true);
    return () => document.removeEventListener("click", protectNavigation, true);
  }, [dirty]);
  function update(key: string, value: string) { setFields(current => ({ ...current, [key]: value })); if (!conflict) setFeedback("Unsaved changes"); }
  function updateItem(index: number, key: keyof ItemValue, value: string) { setItems(current => current.map((item, position) => position === index ? { ...item, [key]: value } : item)); if (!conflict) setFeedback("Unsaved changes"); }
  function changeStatus(status: string) {
    if (busy || conflict) return;
    if (terminalStatus(status) && (!fields.text_79__1?.trim() || !fields.closed_out_date4__1)) {
      setFeedback("Fill in Closed Out By and Closed Out Date in Completion before marking Complete or Voided.");
      document.getElementById("completion-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    update("status", status);
  }

  return <main className="order-page">
    <header className="order-header"><div><p className="development-label">Development</p><h1>{initial.number} · {fields.name || "New Sales Order"}</h1></div>
      <Link prefetch={false} href={terminalStatus(baseline.fields.status) ? "/completed-orders" : "/sales-orders"} onClick={event => {
        if (dirty || saving.current) { event.preventDefault(); setFeedback("Save pending changes before returning to the order list."); }
        else if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          // Fetch the destination from the server instead of restoring a cached list.
          window.location.assign(terminalStatus(baseline.fields.status) ? "/completed-orders" : "/sales-orders");
        }
      }}>{terminalStatus(baseline.fields.status) ? "Completed Sales Orders" : "Sales Orders"}</Link>
    </header>
    <div className="save-toolbar"><OrderTabs orderId={initial.id} current="details" /><span aria-live="polite" role="status">{feedback}</span><button disabled={busy || conflict || emailBusy} onClick={() => void save()}>Save now</button></div>
    {toast && <EmailToast {...toast} onClose={() => setToast(null)} />}
    {conflict && <div className="save-alert" role="alert"><p>{feedback}</p><button onClick={() => { blocked.current = false; setConflict(false); void save(); }}>Retry save</button><button onClick={() => { if (window.confirm("Reload saved values? Your unsaved input will be discarded.")) window.location.reload(); }}>Reload saved values</button></div>}
    <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset className="email-form-lock" disabled={emailBusy}>
      {sections.map(section => <details key={section} id={section === "Completion" ? "completion-section" : undefined} className="form-section" open={section !== "Service and Labor"}><summary>{section}</summary><div className="field-grid">
        {section === "Order Overview" && <>
          <label>Name <span aria-label="required">*</span><input name="name" value={fields.name ?? ""} onChange={event => update("name", event.target.value)} required /></label>
          <label>SO Number<input value={initial.number} readOnly /></label>
          <label>Date Entered<DateField label="Date Entered" value={fields.dateEntered ?? ""} onChange={value => update("dateEntered", value)} /></label>
          <label>Submitted By<input value={initial.creator} readOnly /></label>
          <div><span>Status</span><details className="status-picker"><summary className={`status-box status-${fields.status?.replaceAll(" ", "-")}`}>{fields.status}</summary>{orderStatuses.map(status => <button type="button" disabled={busy || conflict} key={status} onClick={event => { changeStatus(status); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{status}</button>)}</details></div>
        </>}
        {orderFields.filter(field => field.section === section).map(field => <label key={field.key}>{field.label}
          {field.options ? <select value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)}><option value="">—</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
            : field.type === "date" ? <DateField label={field.label} value={fields[field.key] ?? ""} onChange={value => update(field.key, value)} />
            : field.type === "textarea" ? <textarea value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} />
              : <input type={field.type} step={field.type === "number" ? "any" : undefined} value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} />}
        </label>)}
      </div>
      {section === "Completion" && <>
        <p>Closed Out By and Closed Out Date are required when marking Complete or Voided.</p>
        <div className="field-grid">{[["completedBy", "Completed By"], ["completionDate", "Completion Date (UTC)"], ["voidedBy", "Voided By"], ["voidedDate", "Voided Date (UTC)"]].map(([key, label]) => <label key={key}>{label}<input value={fields[key] ?? ""} readOnly /></label>)}</div>
        <div className="closeout-actions"><button type="button" disabled={busy || conflict || fields.status === "Complete"} onClick={() => changeStatus("Complete")}>Mark Complete</button><button type="button" disabled={busy || conflict || fields.status === "Voided"} onClick={() => changeStatus("Voided")}>Mark Voided</button></div>
      </>}
      {section === "Additional Information" && <div className="assignment-picker"><h3>Assigned To</h3><ul>{assigneeIds.map(id => { const user = users.find(user => user.id === id); return <li key={id}>{user?.displayName || user?.email || "Unavailable user"}{user && !user.active ? " (inactive)" : ""} <button type="button" aria-label={`Remove ${user?.displayName || user?.email || "user"}`} onClick={() => { setAssigneeIds(current => current.filter(value => value !== id)); if (!conflict) setFeedback("Unsaved changes"); }}>Remove</button></li>; })}</ul><div className="assignment-actions"><label>Add employee<select value="" onChange={event => { if (event.target.value) { setAssigneeIds(current => [...new Set([...current, event.target.value])].sort()); if (!conflict) setFeedback("Unsaved changes"); } }}><option value="">Choose an employee</option>{users.filter(user => user.active && !assigneeIds.includes(user.id)).map(user => <option key={user.id} value={user.id}>{user.displayName || user.email}</option>)}</select></label>{canSendEmail && <div className="email-placeholder"><button className="primary-button" type="button" disabled={busy || conflict || emailBusy || (!emailId && !assigneeIds.length)} onClick={() => void sendEmail()} aria-describedby="email-test-notice">{emailBusy ? "Sending…" : emailId ? "Retry SO Email" : "Send SO Email"}</button><small id="email-test-notice">{emailId ? "Retry sends the original saved email snapshot." : "Development: assigned recipients must be kent@cartsandparts.com."}</small></div>}</div></div>}
      {section === "Items and Pricing" && <div className="item-rows">{items.map((item, index) => <fieldset key={index}><legend>Item {index + 1}</legend><label>Quantity<input inputMode="decimal" value={item.quantity} onChange={event => updateItem(index, "quantity", event.target.value)} /></label><label>Description<input value={item.description} onChange={event => updateItem(index, "description", event.target.value)} /></label><label>Unit Price<input inputMode="decimal" value={item.unitPrice} onChange={event => updateItem(index, "unitPrice", event.target.value)} /></label></fieldset>)}<button type="button" onClick={() => { setItems(current => [...current, { description: "", quantity: "", unitPrice: "" }]); if (!conflict) setFeedback("Unsaved changes"); }}>+ Add Item</button></div>}
      </details>)}
      </fieldset>
    </form>
  </main>;
}
