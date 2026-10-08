export type EmailPayload = { from: string; to: string[]; subject: string; text: string; html: string };
export const developmentRecipient = "kent@cartsandparts.com";
export const developmentSender = "Carts and Parts Operations <onboarding@resend.dev>";
export class EmailPolicyError extends Error {}

export function verifyEmailRecipients(recipients: string[]) {
  if (!recipients.length || recipients.some(email => email.toLowerCase() !== developmentRecipient)) {
    throw new EmailPolicyError("Development email can only be sent to kent@cartsandparts.com. Remove other assignees to test; nobody is redirected.");
  }
}
export function emailConfiguration() {
  const target = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") || target?.hostname !== "ep-bold-sky-b5e3vwct-pooler.c-7.us-east-2.aws.neon.tech" || target.pathname !== "/neondb") {
    throw new EmailPolicyError("Email is enabled only in the verified development environment. Live sender setup is still required.");
  }
  if (!process.env.RESEND_API_KEY) throw new EmailPolicyError("Resend API key is missing. Add RESEND_API_KEY to .env.local and restart the server.");
  return { apiKey: process.env.RESEND_API_KEY };
}

export async function deliverEmail(payload: EmailPayload, key: string): Promise<string> {
  const { apiKey } = emailConfiguration();
  verifyEmailRecipients(payload.to);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Resend did not accept the request. Retry this saved attempt; check the Resend dashboard if the problem continues.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") throw new Error("Email acceptance could not be confirmed. Retry the saved attempt.");
  return result.id;
}
