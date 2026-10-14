"use client";
import { useState, useTransition } from "react";
import { deleteEmployee } from "./actions";
import { ConfirmationDialog } from "../../ui/confirmation-dialog";

export function DeleteUser({ id, name, updatedAt, retry }: { id: string; name: string; updatedAt: string; retry: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, startTransition] = useTransition();
  return <div className="user-delete-controls">
    <button className="danger-button" type="button" disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Deleting…" : retry ? "Retry User Deletion" : "Delete User Account"}</button>
    {message && <p role="status">{message}</p>}
    {confirm && <ConfirmationDialog title={`Delete ${name}’s login?`} description="This permanently deletes their Clerk login and blocks app access. Their name, sales orders, files and company history are retained. This is not reversible through the app; use deactivation if you may need to restore access." confirmLabel={retry ? "Retry User Deletion" : "Delete User Account"} busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => startTransition(async () => {
      try { const result = await deleteEmployee({ id, expectedUpdatedAt: updatedAt }); setMessage(result.error || "User login deleted. Company records are preserved."); }
      catch { setMessage("Could not confirm deletion. Reload to check the account and retry if needed."); }
      setConfirm(false);
    })} />}
  </div>;
}
