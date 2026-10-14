# User login deletion

Kent authorized Super Admin-only deletion now. Other admins retain deactivate/reactivate and existing role management; delegation of deletion is deferred.

Deletion permanently removes the Clerk login, not company order/history records. Retain the AppUser identity/name/email as an inactive historical record. Protect Super Admin from deletion. Record request, provider completion/failure; block access before external deletion. Failed/uncertain deletion stays inactive and retryable. Never reactivate pending/deleted accounts through ordinary controls or invitations. Rehiring a deleted account requires a separately reviewed recovery feature.

Acceptance: server verifies active Super Admin; reject ordinary admin/user requests and protected targets; stale confirmation rejected; provider failure leaves durable pending state; retry/not-found succeeds safely once; history/order associations preserved. Test fake provider only in automated development checks, without deleting any real Clerk identity. Run focused lint, access tests, migration on verified development only and production build. Kent reviews the real UI with a disposable test account.
