import Link from "next/link";
import { requireAdmin } from "../../../lib/access";
import { getDatabase } from "../../../lib/db";
import { AuthenticatedShell } from "../../ui/authenticated-shell";
import { UserRow } from "./user-row";
import { isSuperAdminAccount } from "../../../lib/super-admin-policy";
import { InviteEmployee, InvitationControls } from "./invitations";
import { compareUserNames } from "../../../lib/user-display-sort";

type AuditDetails = { actor: string; employee: string; action?: string; before: { role: string; active: boolean }; after: { role: string; active: boolean } };
export default async function Users() {
  const actor = await requireAdmin();
  const db = getDatabase();
  const [users, history, invitations] = await Promise.all([
    db.appUser.findMany({ select: { id: true, email: true, displayName: true, role: true, active: true, updatedAt: true, loginDeletionRequestedAt: true, loginDeletedAt: true }, orderBy: [{ active: "desc" }, { displayName: "asc" }, { email: "asc" }] }),
    db.userAccessAudit.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 }),
    db.employeeInvitation.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 }),
  ]);
  const canDelete = users.some(user => user.id === actor.id && user.active && user.role === "ADMIN" && isSuperAdminAccount(user.email));
  const listed = users.filter(user => !user.loginDeletedAt).sort(compareUserNames);
  const admins = listed.filter(user => user.role === "ADMIN");
  const employees = listed.filter(user => user.role === "USER");
  const renderUser = (user: typeof users[number]) => <UserRow key={`${user.id}-${user.updatedAt.toISOString()}`} user={{ id: user.id, email: user.email, displayName: user.displayName, role: user.role, active: user.active, updatedAt: user.updatedAt.toISOString(), deletionPending: Boolean(user.loginDeletionRequestedAt && !user.loginDeletedAt), deleted: Boolean(user.loginDeletedAt) }} self={user.id === actor.id} protectedAccount={isSuperAdminAccount(user.email)} canDelete={canDelete} />;
  return <AuthenticatedShell title="User Management" active="Administration" admin><main className="screen-page">
    <Link href="/administration">Administration</Link><h1>User Management</h1>
    <p>Manage approved employee access. Inactive employees retain their orders, assignments and history. Calendar names are managed separately.</p>
    <p>Admins can deactivate and reactivate employees. Only the Super Admin can permanently delete a login.</p>
    <InviteEmployee />
    <details className="content-panel"><summary>Invitations ({invitations.length}{invitations.length === 50 ? "+" : ""})</summary><p>Latest 50 requests. Clerk acceptance confirms the request, not inbox delivery. Times shown in America/Chicago.</p>
      {invitations.length === 0 ? <p>No invitations yet.</p> : <div className="table-scroll"><table><thead><tr><th>Email</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead><tbody>{invitations.map(row => <tr key={row.id}><td>{row.email}</td><td>{row.expiresAt < new Date() && !["CANCELLED", "ACCEPTED", "FAILED"].includes(row.state) ? "Expired" : ({ SENT: "Clerk accepted request", SENDING: "Sending / check status", UNCERTAIN: "Needs review", CANCELLED: "Cancelled", ACCEPTED: "Joined", FAILED: "Not sent" }[row.state] || row.state)}</td><td>{row.expiresAt.toLocaleString("en-US", { timeZone: "America/Chicago" })}</td><td><InvitationControls id={row.id} state={row.state} /></td></tr>)}</tbody></table></div>}
    </details>
    <section className="user-management-group" aria-labelledby="admins-heading"><h2 id="admins-heading">Admins ({admins.length})</h2>{admins.map(renderUser)}{!admins.length && <p>No administrators to display.</p>}</section>
    <section className="user-management-group" aria-labelledby="users-heading"><h2 id="users-heading">Users ({employees.length})</h2>{employees.map(renderUser)}{!employees.length && <p>No users to display.</p>}</section>
    {users.some(user => user.loginDeletedAt) && <details className="content-panel"><summary>Deleted Users</summary>{users.filter(user => user.loginDeletedAt).sort(compareUserNames).map(renderUser)}</details>}
    <details className="content-panel"><summary>Recent Access History</summary><p>Latest 50 changes · America/Chicago</p>
      {history.length === 0 && <p>No access changes recorded yet.</p>}
      <ol>{history.map(row => { const change = row.changes as unknown as AuditDetails; return <li key={row.id}><strong>{change.actor}</strong> · {row.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago" })}<p>{change.employee}{change.action ? ` · ${change.action}` : ""}: {change.before.role === "ADMIN" ? "Admin" : "User"}, {change.before.active ? "Active" : "Inactive"} → {change.after.role === "ADMIN" ? "Admin" : "User"}, {change.after.active ? "Active" : "Inactive"}</p></li>; })}</ol>
    </details>
  </main></AuthenticatedShell>;
}
