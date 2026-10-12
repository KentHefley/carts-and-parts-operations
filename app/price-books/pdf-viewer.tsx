"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export function PdfViewer({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(800);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [rendered, setRendered] = useState(false);
  const renderQueue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  useEffect(() => {
    let disposed = false;
    let loading: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    void (async () => {
      try {
        const engine = await import("pdfjs-dist");
        if (disposed) return;
        engine.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker-${engine.version}.min.mjs`;
        const base = `/pdfjs/${engine.version}/`;
        loading = engine.getDocument({ url, withCredentials: true, disableRange: true, disableStream: true, cMapUrl: `${base}cmaps/`, cMapPacked: true, standardFontDataUrl: `${base}standard_fonts/`, wasmUrl: `${base}wasm/`, iccUrl: `${base}iccs/` });
        const document = await loading.promise;
        if (!disposed) setPdf(document);
      } catch { if (!disposed) setError("Could not open this PDF. Close and reopen the viewer if the book was replaced."); }
    })();
    return () => { disposed = true; void loading?.destroy(); };
  }, [url]);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(1, Math.floor(entries[0].contentRect.width))));
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    const run = async () => {
      if (cancelled) return;
      setRendered(false);
      try {
        const current = await pdf.getPage(page);
        if (cancelled || !canvas.current) return;
        const natural = current.getViewport({ scale: 1 });
        const viewport = current.getViewport({ scale: width / natural.width * zoom });
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(12_000_000 / (viewport.width * viewport.height)));
        canvas.current.width = Math.ceil(viewport.width * ratio);
        canvas.current.height = Math.ceil(viewport.height * ratio);
        canvas.current.style.width = `${viewport.width}px`;
        canvas.current.style.height = `${viewport.height}px`;
        task = current.render({ canvas: canvas.current, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
        await task.promise;
        const content = await current.getTextContent();
        if (!cancelled) { setText(content.items.map(item => "str" in item ? item.str : "").join(" ")); setRendered(true); }
      } catch { if (!cancelled) setError("This page could not be rendered. Try another page or download the original PDF."); }
    };
    renderQueue.current = renderQueue.current.catch(() => {}).then(run);
    return () => { cancelled = true; task?.cancel(); };
  }, [pdf, page, zoom, width]);
  return <dialog ref={dialog} className="pdf-dialog" aria-labelledby="pdf-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2 id="pdf-title">{title}</h2><button onClick={onClose}>Close</button></header>
    <div className="pdf-toolbar"><button disabled={!pdf || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
      <label>Page <input aria-label="Page number" type="number" min={1} max={pdf?.numPages ?? 1} value={page} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= (pdf?.numPages ?? 1)) setPage(value); }} /></label><span>of {pdf?.numPages ?? "…"}</span>
      <button disabled={!pdf || page >= pdf.numPages} onClick={() => setPage(value => value + 1)}>Next</button>
      <label>Zoom <select value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value === 1 ? "Fit width" : `${value * 100}%`}</option>)}</select></label>
    </div>
    <div className="pdf-status" aria-live="polite">{error ? <p role="alert">{error}</p> : <p role="status">{!rendered ? "Loading page…" : `Page ${page} ready`}</p>}</div>
    <div ref={host} className="pdf-pages"><canvas ref={canvas} role="img" aria-label={`Page ${page} of ${pdf?.numPages ?? "PDF"}`} /><p className="sr-only">{text}</p></div>
  </dialog>;
}

