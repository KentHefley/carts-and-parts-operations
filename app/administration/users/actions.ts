"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { AccessChangeError, type AccessEdit, saveUserAccess } from "../../../lib/user-management";
import { invitationConfiguration, InvitationError } from "../../../lib/invitation-policy";
import { clerkInvitationProvider } from "../../../lib/clerk-invitations";
import { sendEmployeeInvitation, manageEmployeeInvitation } from "../../../lib/invitation-store";
import { deleteUserLogin } from "../../../lib/user-deletion";
import { clerkUserDeletionProvider } from "../../../lib/clerk-user-deletion";

export async function updateAccess(input: AccessEdit) {
  const actor = await requireAdmin();
  try { await saveUserAccess(getDatabase(), actor.id, input); }
  catch (error) { return { error: error instanceof AccessChangeError ? error.message : "Could not save access settings. Try again." }; }
  revalidatePath("/", "layout");
  if (input.id === actor.id && (!input.active || input.role !== "ADMIN")) redirect("/");
  return { error: "" };
}

export async function deleteEmployee(input: { id: string; expectedUpdatedAt: string }) {
  const actor = await requireAdmin();
  try {
    await deleteUserLogin(getDatabase(), await clerkUserDeletionProvider(), actor.id, input);
    revalidatePath("/", "layout");
    return { error: "" };
  } catch (error) {
    revalidatePath("/administration/users");
    return { error: error instanceof AccessChangeError ? error.message : "Could not confirm user deletion. Reload to check the account, then retry if deletion is pending." };
  }
}

export async function inviteEmployee(input: { id: string; email: string }) {
  const actor = await requireAdmin();
  try {
    const config = invitationConfiguration(process.env);
    await sendEmployeeInvitation(getDatabase(), await clerkInvitationProvider(), actor.id, input, config.allowed);
    revalidatePath("/administration/users");
    return { error: "", message: "Invitation request recorded. Review its status below." };
  } catch (error) {
    revalidatePath("/administration/users");
    return { error: error instanceof InvitationError ? error.message : "Could not process the invitation. Check its status below before trying again.", message: "" };
  }
}

export async function reviewInvitation(id: string, cancel: boolean) {
  const actor = await requireAdmin();
  try {
    if (typeof cancel !== "boolean") throw new InvitationError("Invalid invitation action.");
    const message = await manageEmployeeInvitation(getDatabase(), await clerkInvitationProvider(), actor.id, id, cancel);
    revalidatePath("/administration/users");
    return { error: "", message };
  } catch (error) {
    revalidatePath("/administration/users");
    return { error: error instanceof InvitationError ? error.message : "Could not confirm invitation status. Reload and review the request before trying again.", message: "" };
  }
}
