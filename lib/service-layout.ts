import type { LayoutField } from "./custom-field-model";

export const retiredServiceFields = ["text_32__1", "text14__1"] as const;
export const retiredServiceField = (key: string) => retiredServiceFields.some(value => value === key);

// Pure, narrowly scoped settings transformation. Never touches saved orders.
export function revisedServiceLayout(fields: LayoutField[]): LayoutField[] {
  for (const key of ["numbers__1", "text0__1", ...retiredServiceFields]) {
    const matches = fields.filter(field => field.key === key);
    if (matches.length !== 1 || matches[0].custom || matches[0].deleted) throw new Error("Expected existing core service fields.");
  }
  const miles = fields.find(field => field.key === "numbers__1")!;
  if (miles.type !== "number") throw new Error("Expected numeric Miles field.");
  let next = fields.filter(field => field.key !== miles.key).map(field => retiredServiceField(field.key) && field.active ? { ...field, active: false, revision: field.revision + 1 } : field);
  const anchor = next.findIndex(field => field.key === "text0__1");
  if (next[anchor].section !== "Items and Pricing" || !next[anchor].active) throw new Error("Expected active Travel Price in Items and Pricing.");
  if (next.slice(anchor + 1).some(field => field.section === "Items and Pricing" && field.active && !field.deleted)) throw new Error("Review fields after Travel Price before moving Miles.");
  const originalIndex = fields.findIndex(field => field.key === miles.key);
  const alreadyPlaced = miles.section === "Items and Pricing" && miles.active && fields[originalIndex - 1]?.key === "text0__1";
  const moved = alreadyPlaced ? miles : { ...miles, section: "Items and Pricing", active: true, revision: miles.revision + 1 };
  next = [...next.slice(0, anchor + 1), moved, ...next.slice(anchor + 1)];
  return next;
}
