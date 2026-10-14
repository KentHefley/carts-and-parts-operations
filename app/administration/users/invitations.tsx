"use client";
import { useState, useTransition } from "react";
import { inviteEmployee, reviewInvitation } from "./actions";
import { ConfirmationDialog } from "../../ui/confirmation-dialog";

export function InviteEmployee() {
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, startTransition] = useTransition();
  return <section className="content-panel user-access-card"><h2>Invite Employee</h2>
    <p>Invited employees start with User access. Clerk sends a signup email valid for 30 days. First and last name are collected during signup.</p>
    <form onSubmit={event => { event.preventDefault(); setConfirm(true); }}>
      <label>Employee email<input type="email" required maxLength={254} value={email} disabled={busy} autoComplete="off" onChange={event => { setEmail(event.target.value); setId(""); setMessage(""); }} /></label>
      <button type="submit" disabled={busy || !email.trim()}>Invite Employee</button>
    </form>
    {message && <p role="status">{message}</p>}
    {confirm && <ConfirmationDialog title="Send employee invitation?" description={`Send a Clerk invitation to ${email.trim()} with User access. This sends an email; it does not give administrator permissions.`} confirmLabel="Send Invitation" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => startTransition(async () => {
      const requestId = id || crypto.randomUUID(); setId(requestId);
      try { const result = await inviteEmployee({ id: requestId, email }); setMessage(result.error || result.message); if (!result.error) { setEmail(""); setId(""); } }
      catch { setMessage("Could not confirm the invitation. Review the list below before trying again."); }
      setConfirm(false);
    })} />}
  </section>;
}

export function InvitationControls({ id, state }: { id: string; state: string }) {
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, startTransition] = useTransition();
  if (state === "ACCEPTED") return <span>Employee joined</span>;
  const run = (cancel: boolean) => startTransition(async () => {
    try { const result = await reviewInvitation(id, cancel); setMessage(result.error || result.message); }
    catch { setMessage("Could not confirm status. Reload and try again."); }
    setConfirm(false);
  });
  return <><button type="button" disabled={busy} onClick={() => run(false)}>Check Status</button>{" "}<button type="button" disabled={busy} onClick={() => setConfirm(true)}>{state === "CANCELLED" ? "Retry Cancellation" : "Cancel Invitation"}</button>
    {message && <p role="status">{message}</p>}
    {confirm && <ConfirmationDialog title="Cancel employee invitation?" description="Block this invitation from approving app access and revoke its Clerk link where possible. Existing approved employee accounts are unchanged." confirmLabel="Cancel Invitation" onConfirm={() => run(true)} onCancel={() => setConfirm(false)} busy={busy} />}
  </>;
}
