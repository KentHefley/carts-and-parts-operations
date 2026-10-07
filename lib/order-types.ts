export type ItemValue = { description: string; quantity: string; unitPrice: string };
export type OrderView = { id: string; number: string; creator: string; fields: Record<string, string>; items: ItemValue[] };
export type SaveRequest = { id: string; base: Record<string, string>; patch: Record<string, string>; baseItems?: ItemValue[]; items?: ItemValue[] };

export function chicagoDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function conflicts(current: Record<string, string>, base: Record<string, string>, patch: Record<string, string>) {
  return Object.keys(patch).filter(key => (current[key] ?? "") !== (base[key] ?? "") && current[key] !== patch[key]);
}
