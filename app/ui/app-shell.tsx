"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "../notifications/notification-bell";

const navigation: { label: string; href?: string; icon: string }[] = [
  { label: "Dashboard", href: "/", icon: "home" },
  { label: "Sales Orders", href: "/sales-orders", icon: "orders" },
  { label: "Completed Sales Orders", href: "/completed-orders", icon: "check" },
  { label: "Price Books", icon: "book" },
  { label: "Calendar", icon: "calendar" },
  { label: "Time Off/Birthday Calendar", icon: "people" },
];
export function NavigationIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = { home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z", orders: "M6 3h12v18H6ZM9 8h6M9 12h6M9 16h4", check: "M5 12l4 4L19 6", book: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 6v16", calendar: "M4 5h16v16H4ZM4 10h16M8 3v4M16 3v4", people: "M16 21v-3a4 4 0 0 0-8 0v3M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", report: "M5 21V11M12 21V3M19 21V7", settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind] || paths.orders} /></svg>;
}
function preference(key: string, value: string) {
  document.cookie = `${key}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
export function AppShell({ title, active, admin, initialTheme, initialCollapsed, children }: { title: string; active: string; admin: boolean; initialTheme: "light" | "dark"; initialCollapsed: boolean; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next); document.documentElement.dataset.theme = next; preference("cp-theme-v1", next);
  }
  const navItems = admin ? [...navigation, { label: "Reports", icon: "report" }, { label: "Administration", icon: "settings" }] : navigation;
  return <div onKeyDown={event => { if (event.key === "Escape" && mobileOpen) { setMobileOpen(false); document.querySelector<HTMLButtonElement>(".mobile-nav-toggle")?.focus(); } }} className={`app-shell${collapsed ? " sidebar-collapsed" : ""}${mobileOpen ? " mobile-nav-open" : ""}`}>
    <a className="skip-link" href="#workspace-content">Skip to content</a>
    <aside className="app-sidebar" id="app-navigation">
      <Link className="app-brand" href="/" aria-label="Carts and Parts Operations dashboard"><Image className="brand-light" src="/branding/logo.png" alt="Carts and Parts, Inc." width={465} height={85} priority /><Image className="brand-dark" src="/branding/logo-white.png" alt="Carts and Parts, Inc." width={465} height={85} priority /><span>OPERATIONS</span></Link>
      <nav aria-label="Main navigation">{navItems.map(item => item.href ? <Link key={item.label} href={item.href} prefetch={false} aria-current={active === item.label ? "page" : undefined} title={collapsed ? item.label : undefined} onClick={() => setMobileOpen(false)}><NavigationIcon kind={item.icon} /><span>{item.label}</span></Link> : <button key={item.label} type="button" disabled title={`${item.label} — coming later`}><NavigationIcon kind={item.icon} /><span>{item.label}<small>Coming later</small></span></button>)}</nav>
      <button className="sidebar-toggle" onClick={() => { setCollapsed(!collapsed); preference("cp-sidebar-v1", collapsed ? "expanded" : "collapsed"); }} aria-expanded={!collapsed} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : undefined}>{collapsed ? "»" : "« Collapse navigation"}</button>
      <p className="sidebar-environment">Development</p>
    </aside>
    <div className="app-workspace"><header className="app-topbar"><div className="topbar-title"><button className="mobile-nav-toggle" aria-controls="app-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? "Close menu" : "Menu"}</button><strong>{title}</strong></div><div className="header-actions"><Link className="activity-nav-link" href="/activity" prefetch={false}>View All Activity</Link><button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>{theme === "light" ? "Dark mode" : "Light mode"}</button><NotificationBell /><UserButton /></div></header><div id="workspace-content" tabIndex={-1} className="workspace-content">{children}</div></div>
  </div>;
}
