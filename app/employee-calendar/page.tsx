import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { calendarData } from "../../lib/calendar-store";
import { AuthenticatedShell } from "../ui/authenticated-shell";
import { CalendarScreen } from "../calendar/calendar-screen";
import { readCalendarBlackouts } from "../../lib/calendar-blackout-store";
import { isSuperAdminAccount } from "../../lib/super-admin-policy";
export default async function EmployeeCalendarPage() {
 const user = await requireApprovedUser();
 const db = getDatabase();
 const [data, blackouts, account] = await Promise.all([calendarData(db, "employee"), readCalendarBlackouts(db), db.appUser.findUnique({ where: { id: user.id }, select: { email: true } })]);
 const superAdmin = user.role === "ADMIN" && isSuperAdminAccount(account?.email ?? "");
 return <AuthenticatedShell title="Time Off/Birthday Calendar" active="Time Off/Birthday Calendar" admin={user.role === "ADMIN"}><CalendarScreen kind="employee" admin={user.role === "ADMIN"} superAdmin={superAdmin} blackouts={blackouts} {...data} /></AuthenticatedShell>;
}
