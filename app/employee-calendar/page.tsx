import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { calendarData } from "../../lib/calendar-store";
import { AuthenticatedShell } from "../ui/authenticated-shell";
import { CalendarScreen } from "../calendar/calendar-screen";
export default async function EmployeeCalendarPage() {
 const user = await requireApprovedUser();
 return <AuthenticatedShell title="Time Off/Birthday Calendar" active="Time Off/Birthday Calendar" admin={user.role === "ADMIN"}><CalendarScreen kind="employee" admin={user.role === "ADMIN"} {...await calendarData(getDatabase(), "employee", user.id)} /></AuthenticatedShell>;
}
