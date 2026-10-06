# Calendar design review

October 6, 2026. Management Calendar mockup uses fictional events only. The approved application style is reused, with Month as the default plus Week/Day, date navigation, event detail overlay and preview User/Admin mode. The preview role switch is not part of production.

## Confirmed requirements reflected

All approved users can view events across locations. Only admins add/edit/delete them. Events are manually maintained; Scheduled Job Date never creates a calendar entry. Support timed/all-day and multiple-day events, recurrence and single-occurrence/series editing. Display timed events in their event-location time zone; all-day dates remain stable. Production changes are audited.

## Proposed event editor for review

Title, employee/person, division/location, start/end dates, all-day toggle, start/end times, event time zone, recurrence and notes. Employee records must support people without app accounts. Exact event fields and recurrence choices are proposals for review, not inferred from the existing board. Monthly grid starts Sunday in this draft; week-start preference is not yet confirmed.

## Preview limits

Local sample event additions/edits/deletions demonstrate the layout; no calendar data is saved externally. Recurrence selection demonstrates configuration but does not expand repeated events or implement recurrence exceptions. Drag/drop, audit history, persistent permissions, validation and daylight-saving calculations remain implementation work. The sample day view uses the bundled day-schedule renderer. Script syntax checked; full browser-rendered verification remains pending.

## Review next

Kent's first review identified jumbled Month/Week labels. Revised those cells to full-width single-line blue event bars with ellipsis, accessible full labels and tooltips, and details on selection. Removed division/time-zone sublines from boxes; details retain them. Crowded cells show three events plus +N more, opening Day view. The source screenshot is a feature/style reference; no real screenshot events were copied into the mockup.

Kent approved the management calendar layout, including three visible event bars and +N more opening Day view.

## Employee calendar mockup

Time Off/Birthday Calendar reuses the approved Month/Week/Day layout and overflow behavior. Fictional examples show Time Off, Birthday, Work Anniversary and Holiday with distinct colors and visible category labels. A five-event sample day demonstrates +2 more; a three-day time-off entry demonstrates stable all-day dates. Everyone can open details; preview Admin mode exposes category and event editing. The role switch is a review aid only. Sample birthdays/anniversaries show Yearly as a proposed recurrence choice, without expanding occurrences. Event fields and precise colors remain proposals pending review; no employee or Monday data was imported.

Employee preview script syntax checked; browser-rendered verification remains pending. Category administration and real permissions, recurrence, storage and audit remain implementation work. Review the employee calendar, then Reports and Administration before application implementation.
