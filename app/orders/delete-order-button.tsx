"use client";
import { useRef, useState } from "react";
import { moveOrderToTrash } from "./trash-actions";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "../ui/confirmation-dialog";

export function DeleteOrderButton({ orderId, disabled }: { orderId: string; disabled: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const working = useRef(false);
  const router = useRouter();
  async function remove() {
    if (disabled || working.current) return;
    working.current = true; setBusy(true);
    try {
      const result = await moveOrderToTrash(orderId);
      if (result.ok) { router.replace("/sales-orders"); router.refresh(); }
      else setMessage(result.message);
    } catch { setMessage("Deletion could not be confirmed. Reload the order before retrying."); }
    finally { working.current = false; setBusy(false); setConfirmOpen(false); }
  }
  return <section className="form-section"><h2>Delete Sales Order</h2><p>Move this order to admin-only Trash for 30 days. Its files remain available for restoration.</p><button type="button" className="danger-button" disabled={disabled || busy} onClick={() => setConfirmOpen(true)}>{busy ? "Moving to Trash…" : "Delete Sales Order"}</button>{disabled && <p>Save pending changes and finish other actions before deleting.</p>}<p role="status">{message}</p>{confirmOpen && <ConfirmationDialog title="Move sales order to Trash?" description="Only an admin can restore it within 30 days. Its files will be retained during that period." confirmLabel="Move to Trash" busy={busy} confirmDisabled={disabled} onCancel={() => setConfirmOpen(false)} onConfirm={() => void remove()} />}</section>;
}
