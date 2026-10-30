"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { appendBoardRows, type BoardCursor, type BoardFilters, type BoardPage } from "../../lib/order-board-model";
import { startOrderListRefresh } from "../../lib/order-list-refresh";
const emptyRows: BoardPage["rows"] = [];

export function useOrderBoard(initialPage: BoardPage, filters: BoardFilters, paused: boolean) {
  const router = useRouter();
  const { completed, name, number, status } = filters;
  const key = JSON.stringify([completed, name, number, status]);
  const [snapshot, setSnapshot] = useState(() => ({ ...initialPage, pages: 1, key }));
  const current = useRef(snapshot);
  const [pending, setPending] = useState<"search" | "more" | "refresh" | null>(null);
  const [context, setContext] = useState({ key, paused });
  if (context.key !== key || context.paused !== paused) {
    setContext({ key, paused });
    if (context.key !== key || paused) setPending(null);
  }
  const [error, setError] = useState("");
  const request = useRef<{ sequence: number; controller?: AbortController }>({ sequence: 0 });
  const cancel = useCallback(() => {
    request.current.controller?.abort();
    request.current = { sequence: request.current.sequence + 1 };
  }, []);
  const update = useCallback(async (mode: "search" | "more" | "refresh") => {
    if (mode !== "search" && request.current.controller) return;
    cancel();
    const sequence = request.current.sequence;
    const controller = new AbortController();
    request.current.controller = controller;
    setPending(mode); setError("");
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    const previous = current.current;
    async function page(cursor: BoardCursor | null): Promise<BoardPage> {
      const params = new URLSearchParams({ completed: String(completed), name, number, status });
      if (cursor) params.set("cursor", JSON.stringify(cursor));
      const response = await fetch(`/api/orders/board?${params}`, { cache: "no-store", signal: controller.signal });
      if (response.status === 401 || response.status === 403) router.refresh();
      if (!response.ok || response.redirected) throw new Error("Could not load orders.");
      return response.json();
    }
    try {
      let next: typeof snapshot;
      if (mode === "more") {
        if (!previous.nextCursor || previous.key !== key) return;
        const more = await page(previous.nextCursor);
        next = { ...previous, rows: appendBoardRows(previous.rows, more.rows), nextCursor: more.nextCursor, pages: previous.pages + 1 };
      } else {
        const first = await page(null);
        next = { ...first, pages: 1, key };
        // Refresh only the loaded range; commit once so no partially refreshed
        // list is displayed. Each request remains bounded to 50 rows.
        const pages = mode === "refresh" && previous.key === key ? previous.pages : 1;
        while (next.pages < pages && next.nextCursor) {
          const more = await page(next.nextCursor);
          next = { ...next, rows: appendBoardRows(next.rows, more.rows), nextCursor: more.nextCursor, pages: next.pages + 1 };
        }
      }
      if (sequence === request.current.sequence) { current.current = next; setSnapshot(next); }
    } catch {
      if (sequence === request.current.sequence) setError(mode === "more" ? "Could not load more orders. Your current orders and selections are unchanged." : "Could not update orders. Displayed orders may be out of date; please retry.");
    } finally {
      window.clearTimeout(timeout);
      if (sequence === request.current.sequence) { request.current.controller = undefined; setPending(null); }
    }
  }, [cancel, completed, key, name, number, router, status]);
  useEffect(() => {
    if (paused) { cancel(); return; }
    if (current.current.key === key) return;
    cancel();
    const timer = window.setTimeout(() => void update("search"), 300);
    return () => { window.clearTimeout(timer); cancel(); };
  }, [cancel, key, paused, update]);
  useEffect(() => {
    if (paused) return;
    return startOrderListRefresh(() => void update(current.current.key === key ? "refresh" : "search"), () => !!request.current.controller);
  }, [key, paused, update]);
  useEffect(() => cancel, [cancel]);
  const searching = snapshot.key !== key;
  return {
    rows: searching ? emptyRows : snapshot.rows, total: searching ? null : snapshot.total,
    nextCursor: searching ? null : snapshot.nextCursor, pending, searching, error,
    loadMore: () => update("more"), refresh: () => update(searching ? "search" : "refresh"),
  };
}
