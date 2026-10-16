"use client";
import { type LayoutField, employeeIds } from "../../lib/custom-field-model";
import type { AssignableUser } from "../../lib/order-types";
import { DateField } from "./date-field";
export function CustomFieldInput({ field, value, users, onChange }: { field: LayoutField; value: string; users: AssignableUser[]; onChange: (value: string) => void }) {
  if (field.type === "employees") {
    const selected = employeeIds(value);
    return <div className="custom-employees"><span>{field.label}</span><ul>{selected.map(id => <li key={id}>{users.find(user => user.id === id)?.displayName || users.find(user => user.id === id)?.email || "Unavailable employee"} <button type="button" aria-label={`Remove ${users.find(user => user.id === id)?.displayName || "employee"} from ${field.label}`} onClick={() => { const next = selected.filter(key => key !== id); onChange(next.length ? JSON.stringify(next) : ""); }}>Remove</button></li>)}</ul><label>Add employee to {field.label}<select value="" onChange={event => { if (event.target.value) onChange(JSON.stringify([...selected, event.target.value].sort())); }}><option value="">Choose an employee</option>{users.filter(user => user.active && !selected.includes(user.id)).map(user => <option key={user.id} value={user.id}>{user.displayName || user.email}</option>)}</select></label>{field.help && <small>{field.help}</small>}</div>;
  }
  return <label>{field.label}{field.type === "date" ? <DateField label={field.label} value={value} onChange={onChange} />
    : field.type === "textarea" ? <textarea value={value} maxLength={10_000} onChange={event => onChange(event.target.value)} />
    : field.type === "select" ? <select value={value} onChange={event => onChange(event.target.value)}><option value="">—</option>{value && !field.options.includes(value) && <option disabled value={value}>{value} (saved value)</option>}{field.options.map(option => <option key={option}>{option}</option>)}</select>
    : field.type === "checkbox" ? <input type="checkbox" checked={value === "true"} onChange={event => onChange(event.target.checked ? "true" : "false")} />
    : <input type={field.type === "time" ? "time" : "text"} inputMode={["currency", "number"].includes(field.type) ? "decimal" : undefined} value={value} maxLength={10_000} onChange={event => onChange(event.target.value)} />}{field.help && <small>{field.help}</small>}</label>;
}
