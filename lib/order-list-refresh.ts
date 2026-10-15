// Shared timing policy; the caller supplies route refresh and current UI state.
export function startOrderListRefresh(refresh: () => void, paused: () => boolean, browser = window, page = document) {
  let lastRefresh = -Infinity;
  const update = () => {
    if (page.visibilityState !== "visible" || !browser.navigator.onLine || paused()) return;
    const now = Date.now();
    if (now - lastRefresh < 1_000) return; // Focus and visibility often fire together.
    lastRefresh = now;
    refresh();
  };
  const timer = browser.setInterval(update, 15_000);
  browser.addEventListener("focus", update);
  browser.addEventListener("online", update);
  page.addEventListener("visibilitychange", update);
  return () => {
    browser.clearInterval(timer);
    browser.removeEventListener("focus", update);
    browser.removeEventListener("online", update);
    page.removeEventListener("visibilitychange", update);
  };
}
