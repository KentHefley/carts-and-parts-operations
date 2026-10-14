"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAccess } from "./actions";
import { ConfirmationDialog } from "../../ui/confirmation-dialog";
import { DeleteUser } from "./delete-user";

export function UserRow({ user, self, protectedAccount = false, canDelete = false }: { user: { id: string; email: string; displayName: string | null; role: "USER" | "ADMIN"; active: boolean; updatedAt: string; deletionPending: boolean; deleted: boolean }; self: boolean; protectedAccount?: boolean; canDelete?: boolean }) {
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const name = user.displayName || user.email;
  const save = () => startTransition(async () => {
    setMessage("");
    try {
      const result = await updateAccess({ id: user.id, expectedRole: user.role, expectedActive: user.active, role, active });
      setMessage(result.error || "Access settings saved.");
    } catch { setMessage("Could not confirm the save. Reload to check the current settings."); }
    setConfirm(false);
  });
  return <section className="content-panel user-access-card" aria-label={name}>
    <h2>{name}{self ? " (you)" : ""}</h2><p>{user.email} · {user.deleted ? "Login deleted" : user.deletionPending ? "Deletion pending" : user.active ? "Active" : "Inactive"} · {protectedAccount ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "User"}</p>
    {protectedAccount ? <p>Protected account. Its administrator role and active access cannot be removed in User Management.</p> : user.deleted ? <p>The login was permanently deleted. Company records and historical attribution remain.</p> : user.deletionPending ? <p>App access is blocked. Login deletion still needs confirmation; the Super Admin can retry it.</p> : <>
    <div className="user-access-fields">
      <label>Role<select aria-label={`Role for ${name}`} value={role} disabled={pending} onChange={e => setRole(e.target.value as typeof role)}><option value="USER">User</option><option value="ADMIN">Admin</option></select></label>
      <label><input type="checkbox" checked={active} disabled={pending} onChange={e => setActive(e.target.checked)} /> Active access</label>
    </div>
    {self && (role !== "ADMIN" || !active) && <p>You are changing your own access. After saving, this administration page will no longer be available to you.</p>}
    <button type="button" disabled={pending || (role === user.role && active === user.active)} onClick={() => setConfirm(true)}>{pending ? "Saving…" : "Save Access"}</button>
    {confirm && <ConfirmationDialog title={`Change access for ${name}?`} description={`Save ${role === "ADMIN" ? "Admin" : "User"} role with ${active ? "active" : "inactive"} access. Inactive access blocks subsequent protected app requests. Orders, assignments and history are preserved.${self ? " This changes your own access." : ""}`} confirmLabel="Save Access" onConfirm={save} onCancel={() => setConfirm(false)} busy={pending} />}
    {message && <p role="status">{message} <button type="button" onClick={() => router.refresh()}>Reload</button></p>}
    </>}
    {canDelete && !protectedAccount && !user.deleted && <DeleteUser id={user.id} name={name} updatedAt={user.updatedAt} retry={user.deletionPending} />}
  </section>;
}
