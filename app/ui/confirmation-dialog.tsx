"use client";
import { useEffect, useId, useRef } from "react";

// Mount only while open. Native modal semantics keep the rest of the app inert.
export function ConfirmationDialog({ title, description, confirmLabel, onConfirm, onCancel, busy = false, confirmDisabled = false }: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  confirmDisabled?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const modal = dialog.current;
    modal?.showModal();
    cancel.current?.focus();
    return () => {
      modal?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className="confirmation-dialog" role="alertdialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id={`${id}-title`}>{title}</h2>
    <p id={`${id}-description`}>{description}</p>
    {busy && <p role="status">Working…</p>}
    <div className="confirmation-actions">
      <button ref={cancel} type="button" disabled={busy} onClick={onCancel}>Cancel</button>
      <button className="danger-button" type="button" disabled={busy || confirmDisabled} onClick={() => { if (!busy && !confirmDisabled) onConfirm(); }}>{busy ? "Working…" : confirmLabel}</button>
    </div>
  </dialog>;
}
