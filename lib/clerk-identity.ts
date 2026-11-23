import type { UserJSON } from "@clerk/backend";

export type EmployeeIdentity = {
  id: string; firstName: string | null; lastName: string | null;
  primaryEmailAddressId: string | null; banned: boolean; locked: boolean;
  publicMetadata: Record<string, unknown>;
  emailAddresses: { id: string; emailAddress: string; verification: { status: string } | null }[];
};

export async function freshIdentity(userId: string, secretKey: string, request: typeof fetch = fetch): Promise<EmployeeIdentity> {
  // A signal opts out of Next.js render-time GET memoization for this retry.
  const response = await request(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Employee identity service unavailable.");
  const identity: UserJSON = await response.json();
  if (identity.id !== userId || identity.object !== "user" || !Array.isArray(identity.email_addresses)
    || typeof identity.banned !== "boolean" || typeof identity.locked !== "boolean") {
    throw new Error("Employee identity response could not be verified.");
  }
  return {
    id: identity.id, firstName: identity.first_name, lastName: identity.last_name,
    primaryEmailAddressId: identity.primary_email_address_id, banned: identity.banned, locked: identity.locked,
    publicMetadata: identity.public_metadata,
    emailAddresses: identity.email_addresses.map(email => ({ id: email.id, emailAddress: email.email_address,
      verification: email.verification ? { status: email.verification.status } : null })),
  };
}
