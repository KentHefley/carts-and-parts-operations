"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { markNotificationsRead, readNotifications } from "./actions";

export function NotificationBell() {
  const [data, setData] = useState<Awaited<ReturnType<typeof readNotifications>>>({ unread: 0, rows: [] });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => { try { setData(await readNotifications()); setError(""); } catch { setError("Couldn’t refresh notifications."); } }, []);
  useEffect(() => { let active = true; readNotifications().then(result => { if (active) setData(result); }).catch(() => { if (active) setError("Could not refresh notifications."); }); const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15_000); const focus = () => { void refresh(); }; window.addEventListener("focus", focus); return () => { active = false; clearInterval(timer); window.removeEventListener("focus", focus); }; }, [refresh]);
  return <div className="notification-bell"><button type="button" className={data.unread ? "bell-unread" : ""} aria-label={`Notifications, ${data.unread} unread`} aria-expanded={open} onClick={() => { setOpen(value => !value); void refresh(); }}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg> <span aria-hidden="true">{data.unread || ""}</span></button>{open && <section className="notification-panel" aria-label="Notifications"><h2>Notifications</h2><button type="button" onClick={async () => { try { setData(await markNotificationsRead()); setError(""); } catch { setError("Couldn’t mark notifications as read."); } }}>Mark all as read</button><button type="button" onClick={() => setOpen(false)}>Close</button>{error && <p role="alert">{error}</p>}<ul>{data.rows.map(row => <li key={row.id} className={row.read ? "" : "notification-unread"}><Link href={`/orders/${row.orderId}`}>{row.number} · {row.name}</Link><p>{row.actor} {row.kind === "assignment" ? "assigned you to this order" : "updated this order"}.</p><time dateTime={row.updatedAt}>{new Date(row.updatedAt).toLocaleString()}</time></li>)}</ul>{!data.rows.length && <p>No notifications yet.</p>}<p>Showing up to 50 latest notifications.</p></section>}</div>;
}
