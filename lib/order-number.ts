// Shared by server-rendered screens and client components. NEXT_PUBLIC_APP_ENV
// is replaced at build time by Next.js.
export function orderNumber(number: number, mode = process.env.NEXT_PUBLIC_APP_ENV): string {
  return mode === "production" ? String(number) : `DEV-${String(number).padStart(6, "0")}`;
}
