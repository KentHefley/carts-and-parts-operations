import { applicationMode, pilotAllowlist, runtimeEnvironment } from "./environment-policy";
export type EmailPayload = { from: string; to: string[]; reply_to?: string; subject: string; text: string; html: string };
export const developmentRecipient = "kent@cartsandparts.com";
export const developmentSender = "Carts and Parts Operations <sales-orders@orders.cartsandparts.com>";
export const developmentReplyTo = "kent@cartsandparts.com";
const developmentRecipients = new Set([developmentRecipient, "jleo3140@gmail.com", "augustforum@gmail.com", "hefleykent@gmail.com"]);
export class EmailPolicyError extends Error {}

export function verifyEmailRecipients(recipients: string[], env: Record<string, string | undefined> = process.env) {
  const allowed = applicationMode(env) === "pilot" ? new Set(pilotAllowlist(env.SO_EMAIL_ALLOWED_RECIPIENTS)) : developmentRecipients;
  if (!recipients.length || recipients.some(email => !allowed.has(email.toLowerCase()))) {
    throw new EmailPolicyError("Non-live email can only be sent to approved test recipients. Remove other assignees to test; nobody is redirected.");
  }
}
export function emailConfiguration() {
  runtimeEnvironment();
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
