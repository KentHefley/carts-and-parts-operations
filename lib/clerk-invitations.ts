import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { invitationConfiguration } from "./invitation-policy";
import { type InvitationProvider } from "./invitation-store";

export async function clerkInvitationProvider(): Promise<InvitationProvider> {
  const configuration = invitationConfiguration(process.env);
  const client = await clerkClient();
  return {
    create: (email, id) => {
      if (!configuration.allowed.includes(email)) throw new Error("Recipient is not allowed.");
      return client.invitations.createInvitation({ emailAddress: email, ignoreExisting: false, notify: true, expiresInDays: 30, redirectUrl: configuration.redirectUrl, publicMetadata: { operationsInvitationId: id } });
    },
    find: async (email, id) => {
      const result = await client.invitations.getInvitationList({ query: email, limit: 100 });
      // Refuse an incomplete provider review rather than guessing about duplicates.
      if (result.totalCount > 100) throw new Error("Provider review requires a narrower search.");
      return result.data.find(row => row.emailAddress.toLowerCase() === email && row.publicMetadata?.operationsInvitationId === id) || null;
    },
    revoke: async id => { await client.invitations.revokeInvitation(id); },
    accountExists: async email => (await client.users.getUserList({ emailAddress: [email], limit: 1 })).totalCount > 0,
  };
}
