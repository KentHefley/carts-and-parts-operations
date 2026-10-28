# Vacation blackout notices — October 28, 2026

Approved: employee-calendar notice-only blackout ranges managed only by protected Super Admin. Inclusive start/end dates and required reason. Shade covered days and label Vacation Blackout; show reasons to all approved users independently of People filters. Do not block or change time off, birthdays, anniversaries, holidays or management schedules. No approval/balance workflow, automatic recurrence or enforcement in this milestone.

Storage: use existing general CalendarEntry with distinct kind vacation-blackout, versioned date-only payload and existing CalendarAudit. Common empty participant fields preserve older calendar readers. No schema migration; backups already cover these tables. Keep a typed range model so later enforcement can reuse it deliberately. Soft-delete the range while retaining immutable audit. Protect all writes server-side using current active Admin identity and protected Super Admin email, not a client flag.

Acceptance: Super Admin add/edit/delete; other admins/users read only; date validation and inclusive multi-day/DST-safe shading; reasons always available; filters do not hide notices; stale revisions cannot overwrite; repeated saves/deletes do not duplicate history; ordinary events remain editable through blackouts. Normal calendar editors must reject blackout IDs.

Verification: unit dates/range bounds; development database permissions, persistence/reopen, optimistic conflicts, idempotency, audit and deletion; normal calendar/time-off overlap allowed, person deletion unaffected; browser month/week/day and mobile notice/manager controls; lint, TypeScript and production build. No pilot data changes or deployment until authorized.

Completed locally: model/store/action/editor and calendar notices/shading implemented. Unit, development database and existing calendar regression checks passed, as did lint/types/production build. Browser component fixture verified roles/filter/zone and view boundaries; mobile notice inspected. Actual signed-in local review remains pending. No pilot deployment or real blackout dates created.
