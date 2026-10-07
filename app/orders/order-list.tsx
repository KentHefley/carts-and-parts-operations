"use client";
import Link from "next/link";
import { useState } from "react";
type Row = { id: string; number: string; name: string; status: string; division: string; jobType: string; scheduled: string };
export function OrderList({ orders }: { orders: Row[] }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState("");
  const rows = orders.filter(order => order.name.toLowerCase().includes(name.toLowerCase()) && order.number.toLowerCase().includes(number.toLowerCase()) && (!status || order.status === status));
  return <>
    <div className="list-filters"><label className="name-filter">Search by Name<input value={name} onChange={event => setName(event.target.value)} /></label><label>SO Number<input value={number} onChange={event => setNumber(event.target.value)} /></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All active statuses</option>{["Pending", "In Progress", "Expedite"].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="table-scroll"><table><thead><tr>{["SO Number", "Name", "Status", "Division", "Job Type", "Scheduled Job Date", "Assigned To"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(order => <tr key={order.id}><td><Link href={`/orders/${order.id}`}>{order.number}</Link></td><td><Link href={`/orders/${order.id}`}>{order.name}</Link></td><td><span className={`status-box status-${order.status.replaceAll(" ", "-")}`}>{order.status}</span></td><td>{order.division || "—"}</td><td>{order.jobType || "—"}</td><td>{order.scheduled || "—"}</td><td>—</td></tr>)}</tbody></table></div>
    {!rows.length && <p className="empty-message">No saved orders match. Choose New Order to begin.</p>}
  </>;
}
