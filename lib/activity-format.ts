type Item = Record<string, unknown>;
const columns = [["description", "Description"], ["quantity", "Quantity"], ["unitPrice", "Unit Price"]] as const;
const isItem = (value: unknown): value is Item => !!value && typeof value === "object" && !Array.isArray(value);

export function activityValue(value: unknown, names: Map<string, string>): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return names.get(value) ?? value;
  if (Array.isArray(value)) return value.map(item => activityValue(item, names)).join("; ") || "—";
  if (typeof value === "object") return Object.entries(value).map(([key, entry]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2")}: ${activityValue(entry, names)}`).join("; ") || "—";
  return String(value);
}

export function itemHistoryRows(before: unknown, after: unknown) {
  const previous = Array.isArray(before) ? before : [];
  const next = Array.isArray(after) ? after : [];
  const rows: { item: number; field: string; before: unknown; after: unknown }[] = [];
  for (let index = 0; index < Math.max(previous.length, next.length); index++) {
    const oldItem = isItem(previous[index]) ? previous[index] : undefined;
    const newItem = isItem(next[index]) ? next[index] : undefined;
    if (!oldItem || !newItem) rows.push({ item: index + 1, field: "Item row", before: oldItem ? "Present" : "—", after: newItem ? "Added" : "Removed" });
    for (const [key, label] of columns) {
      const oldValue = oldItem?.[key] ?? "";
      const newValue = newItem?.[key] ?? "";
      if (oldValue !== newValue) rows.push({ item: index + 1, field: label, before: oldValue, after: newValue });
    }
  }
  return rows;
}
