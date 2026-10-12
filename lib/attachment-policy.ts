export const maxAttachmentSize = 20_000_000;
export const attachmentTypes: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
export function attachmentInput(filename: unknown, size: unknown) {
  if (typeof filename !== "string" || !filename.trim() || filename.length > 240 || /[\\/\x00-\x1f\x7f]/.test(filename)) throw new Error("Use a filename without folders or control characters (up to 240 characters).");
  const contentType = attachmentTypes[filename.split(".").pop()?.toLowerCase() ?? ""];
  if (!contentType) throw new Error("Choose a PDF, JPG, PNG or WebP file.");
  if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > maxAttachmentSize) throw new Error("Files must be nonempty and no larger than 20 MB.");
  return { filename, size, contentType };
}
export function fileSignature(bytes: Uint8Array, contentType: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (contentType === "application/pdf") return starts(37, 80, 68, 70, 45);
  if (contentType === "image/jpeg") return starts(255, 216, 255);
  if (contentType === "image/png") return starts(137, 80, 78, 71, 13, 10, 26, 10);
  if (contentType === "image/webp") return starts(82, 73, 70, 70) && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
  return false;
}
export function canManageAttachments(active: boolean, role: string, assigned: boolean) { return active && (role === "ADMIN" || assigned); }
export const validAttachmentId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
