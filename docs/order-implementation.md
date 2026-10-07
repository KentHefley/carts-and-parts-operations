# Order persistence increment — October 7, 2026

Authorized by Kent: implement New Order, immediate numbering, form entry, saving and reopening using reviewed requirements. Existing milestone-1.md acceptance criteria and verification scenarios apply.

Plan: preserve source-mapped optional fields as validated values in PostgreSQL JSON while core identity/creator/name and repeatable items use explicit models. No Monday records are imported. Each field has a stable mapping; no fields are inferred from screenshot completeness. Separate items retain decimal quantity/unit price. An immutable change table records saved edits with actor and before/after values. Additive migration only in the verified development database.

Reserve numbers using a database sequence and a unique creator/request key. A retry returns the same reservation; abandoned numbers remain used. Display DEV-prefixed numbers to distinguish test numbering. Reservations without Name are excluded from ordinary lists. Default active status is In Progress, blank Division, three rows. Date Entered defaults at first save using America/Chicago and remains editable.

Save changed fields only. Lock the order row in each transaction and compare each changed field's previous value. Reject competing same-field edits without altering the order; independent fields merge. Repeatable item collections receive equivalent protection. Preserve client input during failure/conflict and provide an explicit reload action.

Acceptance checks: authenticated/approved guard on every server resource; concurrent/idempotent numbering; Name validation; defaults; blank optional values; extra items; reopen; independent edits; conflicting edits; atomic audit; failure feedback. Browser testing cannot bypass authentication; a signed-in test session is needed for complete end-to-end coverage.

Pricing, time calculations, assignment notifications, email, files, copies and closeout are later increments. Preserve their mapped inputs without presenting unfinished actions as working. Do not infer unresolved calculations. Custom-field administration and report grouping remain later scope.
