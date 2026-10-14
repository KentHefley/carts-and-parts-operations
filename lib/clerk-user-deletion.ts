import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { type LoginDeletionProvider } from "./user-deletion";

export async function clerkUserDeletionProvider(): Promise<LoginDeletionProvider> {
  const client = await clerkClient();
  return { remove: async id => {
    try { await client.users.deleteUser(id); }
    catch (error) {
      // A previous attempt may have succeeded before our connection was lost.
      if (!isClerkAPIResponseError(error) || error.status !== 404) throw error;
    }
  } };
}
