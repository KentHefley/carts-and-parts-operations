import { test } from "node:test";
import assert from "node:assert/strict";
import { startOrderListRefresh } from "../lib/order-list-refresh";

test("background refresh respects visibility, connectivity, actions, paired focus events and cleanup", context => {
  let now = 0;
  context.mock.method(Date, "now", () => now);
  const browser = new EventTarget() as EventTarget & { navigator: { onLine: boolean }; setInterval: typeof window.setInterval; clearInterval: typeof window.clearInterval };
  const page = new EventTarget() as EventTarget & { visibilityState: string };
  browser.navigator = { onLine: true };
  page.visibilityState = "visible";
  let tick!: () => void;
  let cleared = false;
  browser.setInterval = ((callback: () => void, interval: number) => { assert.equal(interval, 15_000); tick = callback; return 7; }) as typeof window.setInterval;
  browser.clearInterval = id => { assert.equal(id, 7); cleared = true; };
  let paused = false;
  let count = 0;
  const stop = startOrderListRefresh(() => count++, () => paused, browser as unknown as Window & typeof globalThis, page as unknown as Document);
  page.visibilityState = "hidden"; tick(); assert.equal(count, 0);
  page.visibilityState = "visible"; browser.navigator.onLine = false; tick(); assert.equal(count, 0);
  browser.navigator.onLine = true; paused = true; tick(); assert.equal(count, 0);
  paused = false; browser.dispatchEvent(new Event("focus")); assert.equal(count, 1);
  page.dispatchEvent(new Event("visibilitychange")); assert.equal(count, 1);
  now += 15_000; tick(); assert.equal(count, 2);
  stop(); assert.equal(cleared, true);
  now += 15_000;
  browser.dispatchEvent(new Event("online")); assert.equal(count, 2);
});
