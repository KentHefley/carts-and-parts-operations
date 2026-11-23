"use client";

export default function PageError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="screen-page"><section className="content-panel" role="alert">
    <h1>We couldn’t load this page</h1>
    <p>A service may be temporarily unavailable. Try loading the page again.</p>
    <button type="button" className="primary-button" onClick={() => retry()}>Try again</button>
  </section></main>;
}
