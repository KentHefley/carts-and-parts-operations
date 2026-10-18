// Accept familiar USD entry formats without floating-point conversion or guessing separators.
export function normalizeUnitPrice(value: string): string | null {
  if (typeof value !== "string" || value.length > 100) return null;
  const text = value.trim();
  if (!text) return "";
  const match = /^(-?)\$?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const digits = match[2].replaceAll(",", "");
  if (digits.length > 14) return null;
  const whole = digits.replace(/^0+(?=\d)/, "");
  const fraction = (match[3] ?? "").replace(/0+$/, "");
  const sign = whole === "0" && !fraction ? "" : match[1];
  return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function itemNumberErrors(items: { quantity: string; unitPrice: string }[]) {
  return items.flatMap((item, index) => {
    const errors: { index: number; field: "quantity" | "unitPrice"; message: string }[] = [];
    if (typeof item.quantity !== "string" || (item.quantity !== "" && !/^-?\d{1,14}(\.\d{1,6})?$/.test(item.quantity))) errors.push({ index, field: "quantity", message: "Enter a quantity with up to 6 decimal places." });
    if (normalizeUnitPrice(item.unitPrice) === null) errors.push({ index, field: "unitPrice", message: "Enter an amount such as $126.00 or $1,260.00, with at most 2 decimal places." });
    return errors;
  });
}
