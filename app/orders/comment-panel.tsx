"use client";
import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommentUser, CommentView } from "../../lib/comment-types";
import { saveComment } from "./comment-actions";
import { ConfirmationDialog } from "../ui/confirmation-dialog";

const date = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(value));
export function CommentPanel({ orderId, actorId, rows, users }: { orderId: string; actorId: string; rows: CommentView[]; users: CommentUser[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CommentView | null>(null);
  const [deleting, setDeleting] = useState<CommentView | null>(null);
  const [busy, startTransition] = useTransition();
  const working = useRef(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const names = new Map(users.map(user => [user.id, user.name]));
  function remove() {
    if (!deleting || working.current) return;
    working.current = true;
    startTransition(async () => {
      setError(""); setFeedback("");
      try {
        const result = await saveComment({ operation: "delete", orderId, id: deleting.id, version: deleting.version });
        if (!result.ok) { setError(result.message); return; }
        setFeedback("Comment deleted. Its history is retained."); router.refresh();
      } catch { setError("Could not confirm deletion. Refresh Comments to review before retrying."); }
      finally { working.current = false; setDeleting(null); }
    });
  }
  return <section aria-label="Order updates">
    <div className="comments-heading"><div><h2>Updates</h2><p>Comments for this sales order · times in America/Chicago.</p></div><button type="button" disabled={busy} onClick={() => router.refresh()}>Refresh Comments</button></div>
    <CommentForm orderId={orderId} actorId={actorId} users={users} />
    {editing && <section className="content-panel"><h3>Edit comment by {editing.author}</h3><p>Refreshing comments keeps your draft here. If another person changes it, cancel editing and reopen the latest comment after preserving any text you need.</p><CommentForm key={editing.id} initial={editing} orderId={orderId} actorId={actorId} users={users} onDone={() => setEditing(null)} /></section>}
    {error && <p role="alert">{error}</p>}{feedback && <p role="status">{feedback}</p>}
    {!rows.length && <p className="empty-message">No comments yet. Start the conversation above.</p>}
    <ol className="comment-list">{rows.map(row => <li key={row.id} id={`comment-${row.id}`} className="content-panel">
      <header><div><strong>{row.author}</strong><p><time dateTime={row.createdAt}>{date(row.createdAt)}</time>{row.editedAt && <> · Edited <time dateTime={row.editedAt}>{date(row.editedAt)}</time></>}</p></div>
      {row.canManage && <div className="comment-actions"><button type="button" disabled={busy || Boolean(editing)} aria-label={`Edit comment by ${row.author}`} onClick={() => setEditing(row)}>Edit</button><button type="button" disabled={busy || Boolean(editing)} aria-label={`Delete comment by ${row.author}`} onClick={() => setDeleting(row)}>Delete</button></div>}</header>
      <p className="comment-text">{row.text}</p>
      {row.mentionIds.length > 0 && <p className="comment-mentions">Mentioned: {row.mentionIds.map(id => names.get(id) || "Former employee").join(", ")}</p>}
    </li>)}</ol>
    {deleting && <ConfirmationDialog title="Delete this comment?" description="This permanently removes the comment from Updates. Its original text and revisions remain in the order's audit history. It cannot be restored." confirmLabel="Delete Comment" busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </section>;
}

function CommentForm({ orderId, actorId, users, initial, onDone }: { orderId: string; actorId: string; users: CommentUser[]; initial?: CommentView; onDone?: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const [text, setText] = useState(initial?.text ?? "");
  const [mentionIds, setMentionIds] = useState(initial?.mentionIds ?? []);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const working = useRef(false);
  const attempt = useRef<{ key: string; signature: string } | null>(null);
  const available = users.filter(user => user.active && user.id !== actorId && user.name.toLowerCase().includes(search.toLowerCase()));
  function submit() {
    if (working.current || !text.trim()) return;
    working.current = true;
    const signature = JSON.stringify([text.trim(), [...mentionIds].sort()]);
    if (!attempt.current || attempt.current.signature !== signature) attempt.current = { key: crypto.randomUUID(), signature };
    const requestKey = attempt.current.key;
    startTransition(async () => {
      setError(""); setMessage("");
      try {
        const result = await saveComment(initial
          ? { operation: "edit", orderId, id: initial.id, version: initial.version, text, mentionIds }
          : { operation: "add", orderId, requestKey, text, mentionIds });
        if (!result.ok) { setError(result.message); return; }
        if (initial) onDone?.();
        else { setText(""); setMentionIds([]); setSearch(""); attempt.current = null; setMessage("Comment posted."); }
        router.refresh();
      } catch { setError("Could not confirm the save. Your text is preserved. Refresh Comments to review, or retry unchanged text safely."); }
      finally { working.current = false; }
    });
  }
  return <form className="content-panel comment-form" onSubmit={event => { event.preventDefault(); submit(); }}>
    <label htmlFor={inputId}>{initial ? "Edit Comment" : "New Comment"}</label>
    <textarea id={inputId} value={text} disabled={busy} required maxLength={10_000} rows={4} onChange={event => setText(event.target.value)} aria-describedby={`${inputId}-help`} />
    <p id={`${inputId}-help`} className="screen-caption">Plain text · {text.length.toLocaleString()} / 10,000 characters. Select mentions below. Only new comments send bell notifications; no email is sent.</p>
    <details className="comment-mention-picker"><summary>Mention employees ({mentionIds.length})</summary><label>Find an employee<input value={search} disabled={busy} onChange={event => setSearch(event.target.value)} /></label>
      <div className="comment-mention-options">{available.map(user => <label key={user.id}><input type="checkbox" checked={mentionIds.includes(user.id)} disabled={busy || (mentionIds.length >= 100 && !mentionIds.includes(user.id))} onChange={event => setMentionIds(current => event.target.checked ? [...current, user.id] : current.filter(id => id !== user.id))} />{user.name}</label>)}{!available.length && <p>No active employees match.</p>}</div>
    </details>
    {mentionIds.length > 0 && <ul className="comment-mention-chips">{mentionIds.map(id => { const user = users.find(user => user.id === id); return <li key={id}>{user?.name || "Former employee"}{!user?.active && " (inactive)"}<button type="button" disabled={busy} aria-label={`Remove mention of ${user?.name || "former employee"}`} onClick={() => setMentionIds(current => current.filter(value => value !== id))}>×</button></li>; })}</ul>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <div className="comment-actions"><button className="primary-button" type="submit" disabled={busy || !text.trim()}>{busy ? "Saving…" : initial ? "Save Comment" : "Post Comment"}</button>{initial && <button type="button" disabled={busy} onClick={onDone}>Cancel Editing</button>}</div>
  </form>;
}
