# Whole-order Trash — October 11, 2026

## Plan and acceptance

Creator or active admin may move an order into Trash. Preserve its status, assignments, item rows, files and history for 30 elapsed days. Admin-only Trash shows deletion and expiration times, prior status and inactive assignees. Admin restoration before expiration keeps these values. No early permanent-delete control.

Exclude Trash from ordinary order reads, lists, dashboard, activity, notifications, saving, email and file access. Lock the order for delete/restore/cleanup so simultaneous edits cannot resurrect it. Already issued upload URLs can only write staging objects; finalization must reject trashed orders.

After expiration, claim cleanup durably, delete all tracked final/staging R2 objects, then remove order details, items, assignments, emails, notifications, attachments and detailed history. Retain only the order identity/number, immutable creator reference, deletion actor/time, expiry and purge time in a tombstone. Failed cleanup keeps the inaccessible order and storage keys for retry. Restore is forbidden after expiration or once purge starts.

Provide an admin cleanup action and a guarded development CLI command. A secret-authenticated scheduled endpoint enables hosted daily cleanup; scheduling and secrets must be configured before unattended operation. No live launch or deployment is authorized.

Implemented: versioned additive migration applied to the verified development Neon target; creator/admin Delete Sales Order, paginated Administration/Trash, unchanged admin restoration with inactive flags, access filtering and durable per-file R2 purge progress. Minimal tombstones keep order numbers reserved. The scheduled route validates CRON_SECRET and fails closed for non-development storage targets. vercel.json configures a daily 09:00 UTC job for a future authorized deployment; it is not running on localhost. See deployment.md for activation and operational limits.

The existing save transaction needed a 30-second timeout because notification updates exceeded the default five seconds during regression checks. This does not change the three-second typing debounce. Signed-out browser navigation to Trash still requires login, and unauthenticated maintenance requests return HTTP 401. Actual Delete/Restore/cleanup components were tested in a separate synthetic browser fixture with fake actions for cancellation, duplicate clicks, navigation and failure/success feedback. Full authenticated visual review of the new Trash page remains with Kent.

Verify creator/admin/noncreator/inactive permissions, exact expiration boundary, repeat delete/restore, stale saves/uploads/email, list/activity/file hiding, unchanged restoration, inactive assignment warning, storage failure/retry, partial cleanup and minimal tombstone retention using synthetic records only. Run lint, production build and runtime probes. Deletion/restoration notification policy remains unresolved; no new alerts are sent for these actions.
