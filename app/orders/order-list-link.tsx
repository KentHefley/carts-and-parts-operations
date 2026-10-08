"use client";
import Link from "next/link";

export function OrderListLink({ href, current, children }: { href: "/" | "/completed-orders"; current: boolean; children: React.ReactNode }) {
  return <Link prefetch={false} href={href} aria-current={current ? "page" : undefined} onClick={event => {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      window.location.assign(href);
    }
  }}>{children}</Link>;
}
