import { orderFields, type FieldDefinition } from "./order-fields";

export const formSections = ["Order Overview", "Billing and Store Information", "Items and Pricing", "Additional Information", "Completion", "Service and Labor"];
export const customTypes = ["text", "textarea", "number", "currency", "date", "time", "select", "checkbox", "employees"] as const;
export const typeLabels: Record<string, string> = { text: "Text", textarea: "Long text", number: "Number", currency: "Currency", date: "Date", time: "Time", select: "Dropdown", checkbox: "Checkbox", employees: "Employee selection" };
export type LayoutField = { key: string; label: string; section: string; type: string; help: string; options: string[]; active: boolean; custom: boolean; used: boolean; revision: number; deleted?: boolean };
export type FieldLayout = { version: number; fields: LayoutField[] };
export const customKey = (key: string) => /^custom_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
const special: FieldDefinition[] = [
  { key: "name", label: "Name", type: "text" }, { key: "soNumber", label: "SO Number", type: "text" },
  { key: "dateEntered", label: "Date Entered", type: "date" }, { key: "submittedBy", label: "Submitted By", type: "text" },
  { key: "status", label: "Status", type: "status" },
].map(field => ({ ...field, section: "Order Overview" }));
export function defaultLayout(): FieldLayout {
  return { version: 0, fields: formSections.flatMap(section => [...special, ...orderFields].filter(field => field.section === section).map(field => ({ ...field, options: field.options ?? [], help: "", active: true, custom: false, used: false, revision: 1 }))) };
}
export function employeeIds(value: string): string[] {
  if (!value) return [];
  try { const ids: unknown = JSON.parse(value); if (Array.isArray(ids) && ids.length <= 100 && ids.every(id => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) && new Set(ids).size === ids.length) return ids; } catch {}
  throw new Error("Select each employee only once.");
}
export function displayCustom(field: LayoutField, value: string, names: Map<string, string>) {
  if (!value) return "—";
  if (field.type === "employees") return employeeIds(value).map(id => names.get(id) ?? "Unavailable employee").join(", ") || "—";
  if (field.type === "checkbox") return value === "true" ? "Yes" : "No";
  if (field.type === "currency") return `$${value}`;
  return value;
}
