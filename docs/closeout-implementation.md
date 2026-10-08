# Closeout increment

Implement five statuses through the existing authenticated save action. Complete/Voided transitions require Name, Closed Out By and a valid Closed Out Date. Save pending form values and status together; the existing save queue retains input and conflict feedback. All approved users may close, reopen and edit terminal orders.

Generate protected current actor/name and UTC timestamp metadata on genuine status changes. Clear opposite terminal details, and clear current terminal metadata/reason when returning active. Keep each before/after event with actor and timestamp in existing immutable audit records. JSON fields are additive; no database migration is needed. UTC labels in this increment make timestamps unambiguous without deciding the eventual localized audit display policy.

Completed Sales Orders filters the same records, newest terminal transition first; active list excludes them. Reuse all seven result columns and Name/SO Number/status search. Add read-only Activity Log. Full list filters/sort controls and the reviewed application shell remain later work.

Acceptance checks: missing/blank/invalid closeout inputs fail atomically; generated metadata cannot be submitted; active-to-terminal, terminal-to-terminal and reopening clear/set the correct details; ordinary terminal edits preserve status/metadata; repeated saves produce no extra events; competing transitions conflict; identity/items/assignments/history remain; list membership follows status. Run database regression tests, lint, build and runtime diagnostics. Employee Chrome checks cover both buttons, status-box validation, completed-list search/editing and reopening.
