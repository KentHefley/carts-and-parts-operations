# Order list selection

Latest policy: Completed Sales Orders offers admin-only selection/Trash and no bulk copy. Active-list and opened-order controls retain their existing rules. Dismiss closes results. Verified revised database permissions, UI visibility, lint and build.

Plan: share selection controls across active/completed lists, reuse per-order copying and Trash transactions, authenticate each action, and process selected orders sequentially with visible progress/results. Each copy keeps a stable request key for retries. No new database schema or dependencies.

Acceptance: row checkboxes and a select-all-displayed checkbox; selection toolbar with count, Copy Selected, Move Selected to Trash and Clear Selection. Search changes clear selection. Copy is available to approved users; deletion requires creator/admin for every selected order, checked again server-side. Confirm deletion once in the app, retaining 30-day recovery/files. Keep all in-order controls. Report per-order successes/failures; remove successes from selection and preserve failed copy keys. Bulk copying reads the latest saved source, never another tab's unsaved input.

Checks: mixed creator/admin permissions, active/completed orders, invalid IDs, inactive user, repeated copying/deletion, partial failures, source retention. Browser: header/row/indeterminate selection, filtered results, toolbar rules, confirmation cancel, progress, retries, copied links and failures. Lint, production build and Next runtime diagnostics.

Implemented October 12. Guarded database tests, focused lint, production build and isolated browser checks passed; authenticated employee review remains. Lists process one order per awaited Server Action, with no unawaited background work. Unknown copy results should be retried on the same page to reuse the attempt key; this is not a resumable background bulk-job system.
