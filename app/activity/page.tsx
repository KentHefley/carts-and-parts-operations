import Link from "next/link";
import { requireApprovedUser } from "../../lib/access";
import { ActivityLog } from "./activity-log";
import { AuthenticatedShell } from "../ui/authenticated-shell";

export default async function DashboardActivityPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const user = await requireApprovedUser();
  const { before } = await searchParams;
  const cursor = typeof before === "string" && /^[0-9a-f-]{36}$/i.test(before) ? before : undefined;
  return <AuthenticatedShell title="All Activity" active="" admin={user.role === "ADMIN"}><main className="screen-page"><div className="screen-heading"><h1>All Activity</h1><Link href="/">Dashboard</Link></div><div className="content-panel"><ActivityLog cursor={cursor} /></div></main></AuthenticatedShell>;
}
