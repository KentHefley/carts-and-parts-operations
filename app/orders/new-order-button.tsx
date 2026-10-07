"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { newOrder } from "./actions";

export function NewOrderButton() {
  const router = useRouter();
  const requestKey = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    if (busy) return;
    setBusy(true); setError("");
    requestKey.current ??= crypto.randomUUID();
    try {
      const order = await newOrder(requestKey.current);
      router.push(`/orders/${order.id}`);
    } catch { setError("Couldn’t create an order. Retry to use the same request."); setBusy(false); }
  }
  return <div><button className="primary-button" disabled={busy} onClick={create}>{busy ? "Creating…" : "+ New Order"}</button>{error && <p role="alert">{error}</p>}</div>;
}
