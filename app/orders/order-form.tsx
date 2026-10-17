"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { defaultLayout, displayCustom, formSections, type FieldLayout } from "../../lib/custom-field-model";
import { CustomFieldInput } from "./custom-field-input";
import { hoursWorked } from "../../lib/hours-worked";
import { AssignableUser, ItemValue, OrderView } from "../../lib/order-types";
import { duplicateOrder, persistOrder } from "./actions";
import { missingCloseout, orderStatuses, terminalStatus } from "../../lib/order-status";
import { DateField } from "./date-field";
import { OrderTabs } from "./order-tabs";
import { sendSOEmail } from "./email-actions";
import { EmailToast } from "./email-toast";
import { DeleteOrderButton } from "./delete-order-button";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import { type ChoiceOptions, managedChoice, retainedChoice } from "../../lib/order-choice-policy";

const sections = formSections;
const fallbackLayout = defaultLayout();
const invoiceStorePairs = [
  ["text_13__1", "text_21__1"], // Invoice To → Store Name
  ["text_16__1", "text_24__1"], // Address
  ["text_17__1", "text_25__1"], // City
  ["text_18__1", "text_26__1"], // State
  ["text_19__1", "text_27__1"], // ZIP
  ["text71__1", "text_30__1"], // Phone
] as const;
function revealCloseout(fields: Record<string, string>) {
  const section = document.getElementById("completion-section");
  section?.setAttribute("open", "");
  section?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const input = fields.text_79__1?.trim() ? section?.querySelector<HTMLButtonElement>(".date-field") : document.getElementById("closed-out-by");
  input?.focus({ preventScroll: true });
}
export function OrderForm({ initial, users, layout = fallbackLayout, choices = {}, canSendEmail = false, pendingEmailId }: { initial: OrderView; users: AssignableUser[]; layout?: FieldLayout; choices?: ChoiceOptions; canSendEmail?: boolean; pendingEmailId?: string }) {
  const router = useRouter();
  const [fields, setFields] = useState(initial.fields);
  const [sameAsInvoice, setSameAsInvoice] = useState(false);
  const [items, setItems] = useState(initial.items);
  const [assigneeIds, setAssigneeIds] = useState(initial.assigneeIds);
  const [feedback, setFeedback] = useState(initial.fields.name ? "Saved" : "Enter Name to save");
  const [conflict, setConflict] = useState(false);
  const [reloadOpen, setReloadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState(initial);
  const [closeoutError, setCloseoutError] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyError, setCopyError] = useState("");
  const copyKey = useRef<string | undefined>(undefined);
  const copying = useRef(false);
  const [emailId, setEmailId] = useState(pendingEmailId);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
  const dismissEmailToast = useCallback(() => setToast(null), []);
  const emailKey = useRef<string | undefined>(undefined);
  const sendingEmail = useRef(false);
  const discardConfirmed = useRef(false);
  const saved = useRef(initial);
  const latest = useRef({ fields, items, assigneeIds });
  const saving = useRef(false);
  const blocked = useRef(false);
  const quickClose = useRef<string | null>(null);
  const dirty = Object.keys({ ...baseline.fields, ...fields }).some(key => (fields[key] ?? "") !== (baseline.fields[key] ?? "")) || JSON.stringify(items) !== JSON.stringify(baseline.items) || JSON.stringify(assigneeIds) !== JSON.stringify(baseline.assigneeIds);

  const save = useCallback(async () => {
    if (saving.current || blocked.current) return false;
    const snapshot = latest.current;
    const quick = quickClose.current === snapshot.fields.status;
    const patch = Object.fromEntries(Object.entries(snapshot.fields).filter(([key, value]) => value !== (saved.current.fields[key] ?? "")));
    const itemsChanged = JSON.stringify(snapshot.items) !== JSON.stringify(saved.current.items);
    const assignmentsChanged = JSON.stringify(snapshot.assigneeIds) !== JSON.stringify(saved.current.assigneeIds);
    if (!snapshot.fields.name?.trim()) { setFeedback("Name is required before saving"); return false; }
    if (!Object.keys(patch).length && !itemsChanged && !assignmentsChanged) { setFeedback("Saved"); return true; }
    saving.current = true; setBusy(true); setFeedback("Saving…");
    try {
      const result = await persistOrder({ id: initial.id, base: saved.current.fields, patch, fieldVersions: Object.fromEntries(layout.fields.filter(field => field.custom).map(field => [field.key, field.revision])), ...(quick ? { closeoutMode: "quick" as const } : {}), ...(itemsChanged ? { items: snapshot.items, baseItems: saved.current.items } : {}), ...(assignmentsChanged ? { assigneeIds: snapshot.assigneeIds, baseAssigneeIds: saved.current.assigneeIds } : {}) });
      if (!result.ok) {
        if (result.closeoutRequired) { setCloseoutError(true); setFeedback("Unsaved changes"); revealCloseout(snapshot.fields); return false; }
        blocked.current = true; setConflict(true); setFeedback(result.message + (result.conflict ? ` (${result.conflict.map(key => layout.fields.find(field => field.key === key)?.label ?? key).join(", ")})` : ""));
        return false;
      } else {
        if (quick && quickClose.current === snapshot.fields.status) quickClose.current = null;
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
  }, [initial.id, layout]);

  async function sendEmail() {
    if (copying.current || sendingEmail.current || saving.current || blocked.current) return;
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

  async function copy() {
    if (copying.current || sendingEmail.current || saving.current || blocked.current) return;
    copying.current = true; setCopyBusy(true); setCopyError("");
    try {
      latest.current = { fields, items, assigneeIds };
      if (!await save()) { setCopyError("Save the order and resolve any errors before copying."); return; }
      copyKey.current ??= crypto.randomUUID();
      const result = await duplicateOrder(saved.current, copyKey.current);
      if (!result.ok) { setCopyError(result.message); return; }
      // The form is locked while saving/copying, so navigation loses no input.
      discardConfirmed.current = true;
      router.push(`/orders/${result.order.id}`);
    } catch { setCopyError("The copy result is unknown. Retry Copy Order to recover this same attempt."); }
    finally { copying.current = false; setCopyBusy(false); }
  }

  useEffect(() => {
    latest.current = { fields, items, assigneeIds };
    const quick = quickClose.current === fields.status;
    if (!conflict && (quick || !(terminalStatus(fields.status) && missingCloseout(fields)))) { const timer = setTimeout(() => { void save(); }, quick ? 0 : 3000); return () => clearTimeout(timer); }
  }, [fields, items, assigneeIds, conflict, save, busy]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (!discardConfirmed.current && (dirty || saving.current)) event.preventDefault(); };
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
  function update(key: string, value: string) {
    if (invoiceStorePairs.some(pair => pair.some(fieldKey => fieldKey === key))) setSameAsInvoice(false);
    setFields(current => ({ ...current, [key]: value }));
    if (["text_79__1", "closed_out_date4__1"].includes(key)) {
      const next = { ...fields, [key]: value };
      if (!missingCloseout(next)) setCloseoutError(false);
      else if (terminalStatus(next.status)) setCloseoutError(true);
    }
    if (!conflict) setFeedback("Unsaved changes");
  }
  function updateItem(index: number, key: keyof ItemValue, value: string) { setItems(current => current.map((item, position) => position === index ? { ...item, [key]: value } : item)); if (!conflict) setFeedback("Unsaved changes"); }
  function changeStatus(status: string, quick = false) {
    if (busy || conflict) return;
    if (status === fields.status) return;
    if (!quick && terminalStatus(status) && missingCloseout(fields)) {
      setCloseoutError(true);
      revealCloseout(fields);
      return;
    }
    quickClose.current = quick && terminalStatus(status) ? status : null;
    setCloseoutError(false);
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
    <div className="save-toolbar"><OrderTabs orderId={initial.id} current="details" /><span aria-live="polite" role="status">{copyBusy ? "Copying order…" : feedback}</span><button type="button" disabled={busy || conflict || emailBusy || copyBusy} onClick={() => void copy()}>{copyBusy ? "Copying…" : "Copy Order"}</button><button disabled={busy || conflict || emailBusy || copyBusy} onClick={() => void save()}>Save now</button></div>
    {copyError && <div className="save-alert" role="alert"><p>{copyError}</p><button type="button" onClick={() => setCopyError("")}>Dismiss</button></div>}
    {toast && <EmailToast {...toast} onClose={dismissEmailToast} />}
    {conflict && <div className="save-alert" role="alert"><p>{feedback}</p><button onClick={() => { blocked.current = false; setConflict(false); void save(); }}>Retry save</button><button onClick={() => setReloadOpen(true)}>Reload saved values</button></div>}
    {reloadOpen && <ConfirmationDialog title="Reload saved values?" description="Your unsaved input will be discarded and replaced with the saved order values." confirmLabel="Reload Saved Values" onCancel={() => setReloadOpen(false)} onConfirm={() => { discardConfirmed.current = true; window.location.reload(); }} />}
    <form onClick={() => { if (toast?.success) dismissEmailToast(); }} onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset className="email-form-lock" disabled={emailBusy || copyBusy}>
      {sections.map(section => <details key={section} id={section === "Completion" ? "completion-section" : undefined} className="form-section" open={section !== "Service and Labor"}><summary>{section}</summary><div className="field-grid">
{layout.fields.filter(field => field.active && !field.deleted && field.section === section).map(field => <Fragment key={field.key}>
{field.key === "name" && <label>{field.label} <span aria-label="required">*</span><input name="name" value={fields.name ?? ""} onChange={event => update("name", event.target.value)} required /></label>}
{field.key === "soNumber" && <label>{field.label}<input value={initial.number} readOnly /></label>}
{field.key === "dateEntered" && <label>{field.label}<DateField label={field.label} value={fields.dateEntered ?? ""} onChange={value => update("dateEntered", value)} /></label>}
{field.key === "submittedBy" && <label>{field.label}<input value={initial.creator} readOnly /></label>}
{field.key === "status" && <div><span>{field.label}</span><details className="status-picker"><summary className={`status-box status-${fields.status?.replaceAll(" ", "-")}`}>{fields.status}</summary>{orderStatuses.map(status => <button type="button" disabled={busy || conflict} key={status} onClick={event => { changeStatus(status, true); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{status}</button>)}</details><small className="status-help">Complete or Voided here records your name and today’s closeout date.</small></div>}
{field.key === "text_79__1" && <label htmlFor="closed-out-by">{field.label}<input id="closed-out-by" type="text" value={fields.text_79__1 ?? ""} aria-invalid={closeoutError && !fields.text_79__1?.trim() || undefined} aria-describedby={closeoutError ? "closeout-warning" : "closeout-help"} onChange={event => update("text_79__1", event.target.value)} /></label>}
{field.key === "closed_out_date4__1" && <label>{field.label}<DateField label={field.label} value={fields.closed_out_date4__1 ?? ""} invalid={closeoutError && !fields.closed_out_date4__1} describedBy={closeoutError ? "closeout-warning" : "closeout-help"} onChange={value => update("closed_out_date4__1", value)} /></label>}
{field.custom && <CustomFieldInput field={field} value={fields[field.key] ?? ""} users={users} onChange={value => update(field.key, value)} />}
        {field.key === "text_21__1" && <div className="invoice-copy-control">
          <label><input type="checkbox" checked={sameAsInvoice} aria-describedby="invoice-copy-help" onChange={event => {
            const checked = event.target.checked;
            setSameAsInvoice(checked);
            if (checked) {
              setFields(current => ({ ...current, ...Object.fromEntries(invoiceStorePairs.map(([invoice, store]) => [store, current[invoice] ?? ""])) }));
              if (!conflict) setFeedback("Unsaved changes");
            }
          }} />Store Same as Invoice</label>
          <small id="invoice-copy-help">Copies Invoice name, address, city, state, ZIP and phone into Store fields, replacing their current values. You can edit them afterward. Unchecking keeps the copied values.</small>
        </div>}
        {!field.custom && !["name","soNumber","dateEntered","submittedBy","status","text_79__1","closed_out_date4__1"].includes(field.key) && <label>{field.label}
          {field.key === "hoursWorked" ? <input readOnly value={hoursWorked(fields.hour__1 ?? "", fields.hour6__1 ?? "")} />
            : field.type === "select" ? <select value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)}><option value="">—</option>{retainedChoice(managedChoice(field.key) ? choices[field.key] ?? [] : field.options, fields[field.key] ?? "") && <option value={fields[field.key]} disabled>{fields[field.key]} (saved value; unavailable for new selections)</option>}{(managedChoice(field.key) ? choices[field.key] ?? [] : field.options).map(option => <option key={option}>{option}</option>)}</select>
            : field.type === "date" ? <DateField label={field.label} value={fields[field.key] ?? ""} onChange={value => update(field.key, value)} />
            : field.type === "textarea" ? <textarea value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} />
              : <input type={field.type} step={field.type === "number" ? "any" : undefined} value={fields[field.key] ?? ""} onChange={event => update(field.key, event.target.value)} />}
        {field.help && <small>{field.help}</small>}</label>}{!field.custom && ["name", "soNumber", "dateEntered", "submittedBy", "status", "text_79__1", "closed_out_date4__1"].includes(field.key) && field.help && <small>{field.help}</small>}</Fragment>)}
      </div>
      {section === "Completion" && <>
        <p id="closeout-help">For the buttons below, enter the person responsible for closeout and choose the closeout date. The Status menu closes the order using your name and today’s date. Notes and any void reason remain available here.</p>
        {closeoutError && <div className="closeout-warning" id="closeout-warning" role="alert"><p>Fill in Closed Out By and Closed Out Date before marking Complete or Voided.</p><button type="button" aria-label="Dismiss closeout warning" onClick={() => { setCloseoutError(false); document.getElementById("closed-out-by")?.focus(); }}>×</button></div>}
        <details className="automatic-closeout"><summary>Automatic completion and void records</summary><p>These record who changed the status and when. Enter closeout details in the editable fields above.</p>
        <div className="field-grid">{[["completedBy", "Completed By"], ["completionDate", "Completion Date (UTC)"], ["voidedBy", "Voided By"], ["voidedDate", "Voided Date (UTC)"]].map(([key, label]) => <label key={key}>{label}<input value={fields[key] ?? ""} readOnly /></label>)}</div></details>
        <div className="closeout-actions"><button type="button" disabled={busy || conflict || fields.status === "Complete"} onClick={() => changeStatus("Complete")}>Mark Complete</button><button type="button" disabled={busy || conflict || fields.status === "Voided"} onClick={() => changeStatus("Voided")}>Mark Voided</button></div>
      </>}
      {section === "Additional Information" && <div className="assignment-picker"><h3>Assigned To</h3><ul>{assigneeIds.map(id => { const user = users.find(user => user.id === id); return <li key={id}>{user?.displayName || user?.email || "Unavailable user"}{user && !user.active ? " (inactive)" : ""} <button type="button" aria-label={`Remove ${user?.displayName || user?.email || "user"}`} onClick={() => { setAssigneeIds(current => current.filter(value => value !== id)); if (!conflict) setFeedback("Unsaved changes"); }}>Remove</button></li>; })}</ul><div className="assignment-actions"><label>Add employee<select value="" onChange={event => { if (event.target.value) { setAssigneeIds(current => [...new Set([...current, event.target.value])].sort()); if (!conflict) setFeedback("Unsaved changes"); } }}><option value="">Choose an employee</option>{users.filter(user => user.active && !assigneeIds.includes(user.id)).map(user => <option key={user.id} value={user.id}>{user.displayName || user.email}</option>)}</select></label>{canSendEmail && <div className="email-placeholder"><button className="primary-button" type="button" disabled={busy || conflict || emailBusy || (!emailId && !assigneeIds.length)} onClick={() => void sendEmail()} aria-describedby="email-test-notice">{emailBusy ? "Sending…" : emailId ? "Retry SO Email" : "Send SO Email"}</button><small id="email-test-notice">{emailId ? "Retry sends the original saved email snapshot." : "Development: assigned recipients must be kent@cartsandparts.com."}</small></div>}</div></div>}
      {section === "Items and Pricing" && <div className="item-rows">{items.map((item, index) => <fieldset key={index}><legend>Item {index + 1}</legend><label>Quantity<input inputMode="decimal" value={item.quantity} onChange={event => updateItem(index, "quantity", event.target.value)} /></label><label>Description<input value={item.description} onChange={event => updateItem(index, "description", event.target.value)} /></label><label>Unit Price<input inputMode="decimal" value={item.unitPrice} onChange={event => updateItem(index, "unitPrice", event.target.value)} /></label></fieldset>)}<button type="button" onClick={() => { setItems(current => [...current, { description: "", quantity: "", unitPrice: "" }]); if (!conflict) setFeedback("Unsaved changes"); }}>+ Add Item</button></div>}
      </details>)}
      </fieldset>
    </form>
    {layout.fields.some(field => field.custom && !field.active && !field.deleted && fields[field.key]) && <details className="form-section inactive-custom-fields"><summary>Inactive Fields</summary><dl>{layout.fields.filter(field => field.custom && !field.active && !field.deleted && fields[field.key]).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{displayCustom(field, fields[field.key], new Map(users.map(user => [user.id, user.displayName || user.email])))}</dd></div>)}</dl></details>}
    <p><Link href={`/orders/${initial.id}/print`} prefetch={false}>Print Saved Order</Link></p>
    {canSendEmail && <DeleteOrderButton orderId={initial.id} disabled={dirty || busy || conflict || emailBusy || copyBusy} />}
  </main>;
}
