import { cookies } from "next/headers";
import { AppShell } from "./app-shell";

export async function AuthenticatedShell({ title, active, admin, children }: { title: string; active: string; admin: boolean; children: React.ReactNode }) {
  const preferences = await cookies();
  return <AppShell title={title} active={active} admin={admin} initialTheme={preferences.get("cp-theme-v1")?.value === "dark" ? "dark" : "light"} initialCollapsed={preferences.get("cp-sidebar-v1")?.value === "collapsed"}>{children}</AppShell>;
}
