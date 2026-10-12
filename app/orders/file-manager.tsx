"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { attachmentInput } from "../../lib/attachment-policy";
import { startFile, completeFile, removeFile, retryFileCleanup } from "./file-actions";

type FileRow = { id: string; filename: string; size: number; contentType: string; uploader: string; uploadedAt: string };
const fileUrl = (orderId: string, file: FileRow, download = false) => `/orders/${orderId}/files/${file.id}${download ? "?download=1" : ""}`;
function FilePreview({ orderId, file, onClose }: { orderId: string; file: FileRow; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="file-preview" onCancel={onClose} aria-label={`Preview ${file.filename}`}>
    <header><h2>{file.filename}</h2><button type="button" autoFocus onClick={onClose}>Close</button></header>
    {file.contentType === "application/pdf" ? <iframe title={file.filename} src={fileUrl(orderId, file)} /> : <object aria-label={file.filename} type={file.contentType} data={fileUrl(orderId, file)}><a href={fileUrl(orderId, file, true)}>Download {file.filename}</a></object>}
  </dialog>;
}
export function FileManager({ orderId, files, canManage, admin }: { orderId: string; files: FileRow[]; canManage: boolean; admin: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [preview, setPreview] = useState<FileRow | null>(null);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (working.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  async function verify(id: string) {
    const result = await completeFile(orderId, id);
    if (!result.ok) { setPending(id); throw new Error(result.message); }
    setPending(null); setMessage("File uploaded."); router.refresh();
  }
  async function upload(file?: File) {
    if (!file || working.current || !canManage) return;
    working.current = true; setBusy(true); setMessage(""); setProgress(0); setPending(null);
    try {
      attachmentInput(file.name, file.size);
      const result = await startFile(orderId, crypto.randomUUID(), file.name, file.size);
      if (!result.ok) throw new Error(result.message);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", result.url);
        xhr.setRequestHeader("Content-Type", result.contentType);
        xhr.timeout = 120_000;
        xhr.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Storage rejected the upload. Check bucket CORS settings and try again."));
        xhr.onerror = () => reject(new Error("Upload failed. Check your connection and bucket CORS settings."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Please try again."));
        xhr.send(file);
      });
      setPending(result.id); await verify(result.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { working.current = false; setBusy(false); }
  }
  async function remove(file: FileRow) {
    if (working.current || !window.confirm(`Permanently delete ${file.filename}? This cannot be restored.`)) return;
    working.current = true; setBusy(true);
    try { const result = await removeFile(orderId, file.id); setMessage(result.message); if (result.ok) router.refresh(); }
    catch { setMessage("Deletion result is unknown. Refresh the file list before retrying."); }
    finally { working.current = false; setBusy(false); }
  }
  return <section className="form-section file-manager"><h2>Order Files</h2>
    {canManage ? <div className="file-drop-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length > 1) setMessage("Please add one file at a time."); else void upload(event.dataTransfer.files[0]); }}>
      <label>Add File<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file); }} /></label>
      <p>Choose a file or drag it here. PDF, JPG, PNG or WebP; up to 20 MB each. Original quality is preserved.</p>
    </div> : <p>Assigned employees and admins can add or delete files. All approved users can view and download.</p>}
    {busy && <p role="status">Working… {progress > 0 ? `${progress}% uploaded` : ""}</p>}
    {message && <p role="status">{message}</p>}
    {pending && !busy && <button type="button" onClick={async () => { working.current = true; setBusy(true); try { await verify(pending); } catch (error) { setMessage(error instanceof Error ? error.message : "Verification failed."); } finally { working.current = false; setBusy(false); } }}>Retry upload verification</button>}
    {!files.length ? <p>No files uploaded.</p> : <ul className="order-files">{files.map(file => <li key={file.id}>
      <div><strong>{file.filename}</strong><p>{(file.size / 1_000_000).toFixed(2)} MB · {file.uploader} · {new Date(file.uploadedAt).toLocaleString()}</p></div>
      <div className="file-actions"><button type="button" onClick={() => setPreview(file)}>View</button><a href={fileUrl(orderId, file, true)}>Download</a>{canManage && <button type="button" disabled={busy} onClick={() => void remove(file)}>Delete</button>}</div>
    </li>)}</ul>}
    {admin && <button type="button" disabled={busy} onClick={async () => { working.current = true; setBusy(true); try { const result = await retryFileCleanup(); setMessage(result.message); router.refresh(); } catch { setMessage("Cleanup failed. Please retry."); } finally { working.current = false; setBusy(false); } }}>Retry pending file cleanup</button>}
    {preview && <FilePreview orderId={orderId} file={preview} onClose={() => setPreview(null)} />}
  </section>;
}
