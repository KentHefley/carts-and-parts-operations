"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookKeys, editionLabel, priceBookLimit, type BookView } from "../../lib/price-book-types";
import { startBookUpload, publishBook, saveBookEdition, retryBookCleanup } from "./actions";
import { PdfViewer } from "./pdf-viewer";

export function PriceBooks({ books, admin, pending }: { books: BookView[]; admin: boolean; pending: { id: string; bookKey: string; filename: string }[] }) {
  const [selected, setSelected] = useState(0);
  const [viewing, setViewing] = useState(false);
  const book = books[selected];
  return <section className="price-books">
    <div role="tablist" aria-label="Price books" className="book-tabs">{bookKeys.map((key, index) => <button key={key} id={`book-tab-${key}`} role="tab" aria-selected={selected === index} aria-controls={`book-panel-${key}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => {
      const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
      if (next !== null) { event.preventDefault(); setSelected(next); document.getElementById(`book-tab-${bookKeys[next]}`)?.focus(); }
    }}>{key}</button>)}</div>
    <div role="tabpanel" id={`book-panel-${book.key}`} aria-labelledby={`book-tab-${book.key}`} className="book-panel">
      <h2>{book.key} Price Book</h2>
      <p>{book.file ? `${book.file.pages} pages · ${editionLabel(book.edition)}` : "No PDF uploaded yet"}</p>
      {book.file && <><p>{book.file.filename} · {(book.file.size / 1_000_000).toFixed(1)} MB</p><p>Uploaded {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(book.file.uploadedAt))} CT</p>
        <div className="book-actions"><button onClick={() => setViewing(true)}>View Book</button><a href={bookUrl(book, true)}>Download PDF</a></div></>}
      {admin && <BookAdmin key={`${book.key}-${book.revision}`} book={book} pending={pending.filter(file => file.bookKey === book.key)} />}
    </div>
    {viewing && book.file && <PdfViewer title={`${book.key} Price Book`} url={bookUrl(book)} onClose={() => setViewing(false)} />}
  </section>;
}
export function bookUrl(book: BookView, download = false) { return `/price-books/${book.key}/file?file=${book.file?.id}${download ? "&download=1" : ""}`; }

function BookAdmin({ book, pending }: { book: BookView; pending: { id: string; filename: string }[] }) {
  const router = useRouter();
  const [edition, setEdition] = useState(book.edition);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [retryId, setRetryId] = useState<string | null>(null);
  async function verify(id: string) {
    setBusy(true);
    try { const result = await publishBook(id); setMessage(result.message); if (result.ok) { setRetryId(null); router.refresh(); } else setRetryId(id); }
    catch { setMessage("Publication could not be confirmed. Retry verification before uploading again."); setRetryId(id); }
    finally { setBusy(false); }
  }
  async function upload() {
    if (!file) return;
    if (file.size > priceBookLimit || !/\.pdf$/i.test(file.name)) { setMessage("Choose a PDF up to 20 MB."); return; }
    setBusy(true); setMessage("Uploading PDF…");
    let id: string | null = null;
    try {
      const result = await startBookUpload({ key: book.key, revision: book.revision, edition, filename: file.name, size: file.size, requestKey: crypto.randomUUID() });
      if (!result.ok) { setMessage(result.message); return; }
      id = result.id;
      const response = await fetch(result.url, { method: "PUT", headers: { "content-type": "application/pdf" }, body: file });
      if (!response.ok) throw new Error("Upload failed");
      await verify(id);
    } catch { setMessage("Upload or verification was interrupted. The current book remains available. Retry verification if the upload finished."); if (id) setRetryId(id); }
    finally { setBusy(false); }
  }
  return <section className="book-admin" aria-label="Administrator controls"><h3>Manage {book.key} Book</h3>
    <fieldset disabled={busy}>
      <section className="book-admin-section" aria-labelledby={`edition-heading-${book.key}`}><h4 id={`edition-heading-${book.key}`}>Edition Date</h4><p className="screen-caption">Set the month and year shown beside this book’s page count.</p><div className="book-admin-controls"><label>Edition month and year<input type="month" value={edition} onChange={event => setEdition(event.target.value)} /></label>
      <button onClick={async () => { setBusy(true); try { const result = await saveBookEdition(book.key, book.revision, edition); setMessage(result.message); if (result.ok) router.refresh(); } catch { setMessage("Edition could not be saved. Retry later."); } finally { setBusy(false); } }}>Save Edition</button>
      </div></section>
      <section className="book-admin-section" aria-labelledby={`pdf-heading-${book.key}`}><h4 id={`pdf-heading-${book.key}`}>{book.file ? "Replace PDF" : "Upload PDF"}</h4><p className="screen-caption">Original quality is preserved. Replacements become available after verification, then the previous PDF is removed. The edition date above is used for this upload.</p><div className="book-admin-controls"><label>PDF file (up to 20 MB)<input type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>
      <button disabled={!file} onClick={upload}>{book.file ? "Replace PDF" : "Upload PDF"}</button>
      </div></section>
      {(retryId || pending.length > 0) && <section className="book-admin-section" aria-labelledby={`pending-heading-${book.key}`}><h4 id={`pending-heading-${book.key}`}>Uploads Awaiting Verification</h4><p className="screen-caption">Check an interrupted upload before uploading the same PDF again.</p>
      {retryId && <button onClick={() => verify(retryId)}>Retry Verification</button>}
      {pending.filter(item => item.id !== retryId).map(item => <p key={item.id}>{item.filename} <button onClick={() => verify(item.id)}>Verify Pending Upload</button></p>)}
      </section>}
      <details className="book-maintenance"><summary>Maintenance</summary><p className="screen-caption">Retry removal of leftover PDFs from earlier uploads. This processes pending cleanup for all three books.</p><button onClick={async () => { setBusy(true); try { setMessage((await retryBookCleanup()).message); } catch { setMessage("Cleanup unavailable. Retry later."); } finally { setBusy(false); } }}>Retry pending PDF cleanup</button></details>
    </fieldset><p role="status" aria-live="polite">{busy ? "Working… " : ""}{message}</p>
  </section>;
}
