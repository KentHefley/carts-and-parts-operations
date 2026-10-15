"use client";
import Link from "next/link";

export function OrderTabs({ orderId, current }: { orderId: string; current: "details" | "activity" | "files" | "updates" }) {
  return <nav className="order-tabs" aria-label="Sales order views">
    {current === "details" ? <button className="is-active" type="button" aria-current="page" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Order Details</button> : <Link href={`/orders/${orderId}`} prefetch={false}>Order Details</Link>}
    <Link className={current === "files" ? "is-active" : undefined} aria-current={current === "files" ? "page" : undefined} href={`/orders/${orderId}/files`} prefetch={false}>Files</Link>
    <Link className={current === "updates" ? "is-active" : undefined} aria-current={current === "updates" ? "page" : undefined} href={`/orders/${orderId}/updates`} prefetch={false}>Updates</Link>
    <Link className={current === "activity" ? "is-active" : undefined} aria-current={current === "activity" ? "page" : undefined} href={`/orders/${orderId}/activity`} prefetch={false}>Activity Log</Link>
  </nav>;
}
