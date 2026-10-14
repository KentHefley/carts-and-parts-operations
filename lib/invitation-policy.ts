export class InvitationError extends Error {}
export function invitationSignupReturn(query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  // Preserve Clerk's invitation context without accepting arbitrary return URLs.
  for (const key of ["__clerk_ticket", "__clerk_status"]) {
    const value = query[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  return `/sign-up${params.size ? `?${params}` : ""}`;
}
export function invitationEmail(value: unknown): string {
  if (typeof value !== "string") throw new InvitationError("Enter a valid email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InvitationError("Enter a valid email address.");
  return email;
}
export function invitationConfiguration(env: Record<string, string | undefined>) {
  // No live invitation path is enabled until live rollout is authorized.
  if (!env.CLERK_SECRET_KEY?.startsWith("sk_test_")) throw new InvitationError("Invitations are currently enabled only for the development Clerk instance.");
  const allowed = (env.INVITATION_ALLOWED_RECIPIENTS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  const origin = new URL(env.APP_URL || "http://localhost:3000");
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/" || (origin.protocol !== "https:" && !(origin.protocol === "http:" && origin.hostname === "localhost"))) throw new InvitationError("Set APP_URL to the app's trusted origin.");
  return { allowed, redirectUrl: new URL("/sign-up", origin).toString() };
}
