"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cleanExpiredTrash, restoreTrashedOrder } from "../../orders/trash-actions";
import { ConfirmationDialog } from "../../ui/confirmation-dialog";

export function TrashControl({ orderId }: { orderId?: string }) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const working = useRef(false);
  const router = useRouter();
  async function run() {
    if (working.current) return;
    working.current = true; setBusy(true);
    try {
      const result = orderId ? await restoreTrashedOrder(orderId) : await cleanExpiredTrash();
      setMessage(result.message); router.refresh();
    } catch { setMessage("Action could not be confirmed. Refresh and retry."); }
    finally { working.current = false; setBusy(false); setConfirmOpen(false); }
  }
  return <div><button type="button" disabled={busy} onClick={() => { if (orderId) void run(); else setConfirmOpen(true); }}>{busy ? "Working…" : orderId ? "Restore Order" : "Clean Expired Trash"}</button><p role="status">{message}</p>{confirmOpen && <ConfirmationDialog title="Permanently clean expired Trash?" description="Expired orders and their files will be permanently deleted. Orders within the 30-day restoration period will be kept." confirmLabel="Clean Expired Trash" busy={busy} onCancel={() => setConfirmOpen(false)} onConfirm={() => void run()} />}</div>;
}
