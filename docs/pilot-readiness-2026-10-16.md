# Pilot readiness review — October 16, 2026

Status: automated local regression passed. Pilot/live readiness is not yet established.

Latest Hours Worked display correction: Kent subsequently requested exact hours and minutes instead of the decimal examples recorded below. Current output is 8h 10m for 7:20 AM–3:30 PM and 5h 54m for 9:30 PM–3:24 AM. Missing times remain blank and equal times show 0h 0m. Earlier decimal test results below are historical.

Story: approved employees create and update orders through authenticated pages/actions, PostgreSQL retains records/history, private storage holds files, and explicit email sends reach permitted recipients. Admin-only workflows must enforce permissions at the server boundary.

## Verified in this review

All 15 regression groups passed against the guarded development target. Tests used synthetic records with scoped cleanup; email, invitation and login-deletion providers were fake. No real emails or Clerk deletions were performed.

| Group | Result / coverage |
| --- | --- |
| Unit tests | 40 passed: access, invitations, activity, dates, calendar recurrence/time zones, report/export behavior, user sorting and list refresh |
| Orders | Passed: numbering/retries, persistence, same-field conflicts, assignments, bells, closeout/reopening and activity |
| Copies | Passed: resets, original integrity, relation exclusions, retries/concurrency, inactive access and Trash |
| Bulk selection | Passed: permissions, partial results, retry and completed-order restrictions |
| Email | Passed: creator/admin permission, immutable snapshots, concurrent attempts, failures/retries, acceptance deduplication and recipient allowlist |
| Attachments | Passed using synthetic storage: assignee/admin permissions, validation, original bytes, closeout retention and cleanup recovery |
| Trash | Passed: permissions, 30-day boundary, restoration, inactive assignments, cleanup retry and minimal audit |
| Calendars | Passed: admin mutations, recurrence/exceptions, people/categories and person deletion |
| Reports | Passed: admin permission, date boundaries, known totals, Voided/Trash exclusion and product grouping |
| User management | Passed: role/deactivation, stale edits and protected Super Admin |
| User deletion | Passed with fake provider: Super Admin restriction, blocked pending state, retry and retained historical identity |
| Invitations | Passed with fake provider: permissions, duplicates, cancellation/expiry, uncertain recovery and verified provisioning |
| Dropdown settings | Passed: permissions, inactive retention, stale/concurrent changes and ordering |
| Comments | Passed: author/admin permissions, assignee/mention targeting, edits/history, retries, pagination and Trash |
| Custom fields | Passed: types/decimals, permissions, copy resets, conflicts, ordering, deactivation/deletion and labeled history |

Production build passed after the Hours Worked correction, including TypeScript. Focused ESLint passed. Final Next.js compilation/runtime diagnostics recorded separately in progress.md.

Browser evidence: signed-out Administration navigation reached Clerk sign-in. Signed-out report export and private file requests returned authentication redirects rather than protected content. The maintenance endpoint returned 401 without authorization once the development browser handshake was established. Raw development requests first encounter Clerk's handshake, so those raw redirects alone are not proof of resource-level permissions; database/service regression checks provide the role-specific evidence above.

## Requirement gap corrected

Hours Worked was missing despite Time In/Out being present. Kent approved the rules on October 16: blank until both valid times exist, same-day subtraction, overnight for earlier Time Out, zero for equal times, two decimal places. Added a read-only calculated field after Time Out, including existing saved field layouts, without schema changes. Source time values remain authoritative; manual labor/travel pricing is unchanged.

Three focused tests passed for missing/invalid inputs, same-day/overnight rounding and equal times. Actual OrderForm fixture displayed overnight 8.50, same-day 8.50, equal 0.00 and blank when a time was removed; the derived input was read-only. Native time events were used because the browser automation fill helper did not reliably fire native time-input changes. Real-browser keyboard/time-picker review remains necessary.

## Not yet verified / pilot gates

- Authenticated end-to-end employee review across User, Admin and Super Admin sessions. Existing manual successes are documented, but this run did not log into employee accounts or repeat real delivery/invitation acceptance.
- Price-book replacement lifecycle must be rerun in an isolated database; the existing test deliberately refuses an already-configured database. Preserve the three uploaded books. Verify viewing/download/replacement in the eventual hosted pilot.
- Current real R2 integration, public-access settings, hosted upload CORS and file availability require review. This run used fake storage, not a real R2 upload.
- October 16 database/file recovery drill passed for 25 tables and three original price-book PDFs; see backup-restoration.md. Populated order/attachment association recovery, off-device archives/key storage, retention and automated scheduling remain pending.
- Prepare separated hosted pilot credentials/database/storage, deployment recovery, authenticated daily Trash cleanup and pending-upload/price-book staging cleanup. No deployment was performed.
- Complete supported desktop/mobile browser checks; particularly native Time In/Out input, date pickers, PDF viewer, notifications and simultaneous editing.
- Agree pilot participants and official system of record while Monday.com continues. Historical migration and live SO starting number remain undecided.
- Existing report subtotal scope remains the approved item + manual Labor Price + Travel Price definition. Freight/NTE/AM/specialized charges are not silently added.

Repository housekeeping: tracked `tmp/report-build/node_modules` artifacts have pre-existing local dependency/runtime changes. They were preserved. Review removal from version control and ignore rules separately before future packaging/pushes; no actual env files were found tracked by the checked `.env`/`.env.local` patterns.

## Next employee checks

1. Refresh an order, expand Service and Labor: 08:00–16:30 → 8.50; 22:00–06:30 → 8.50; equal times → 0.00; clearing either time → blank. Save/reopen and copy to confirm results derive from saved times.
2. As User, check Reports/Administration are unavailable and direct links are denied; check ordinary order editing and permitted file actions. As Admin, confirm the corresponding admin workflows work.
3. With two accounts, check same-field conflict, different-field merge, new-order list refresh, assignment/comment bells, and prompt access revocation on deactivation.

No commit, push, production migration, Monday change or live launch performed.
