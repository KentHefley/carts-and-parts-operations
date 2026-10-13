import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { calendarData } from "../../lib/calendar-store";
import { AuthenticatedShell } from "../ui/authenticated-shell";
import { CalendarScreen } from "./calendar-screen";
export default async function CalendarPage() {
 const user = await requireApprovedUser();
 return <AuthenticatedShell title="Calendar" active="Calendar" admin={user.role === "ADMIN"}><CalendarScreen kind="management" admin={user.role === "ADMIN"} {...await calendarData(getDatabase(), "management", user.id)} /></AuthenticatedShell>;
}
