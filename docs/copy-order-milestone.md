# Copy Order milestone

Plan: add a transactional copy operation, an approved-user Server Action and a Copy Order control on the order form. Save pending edits first; reject a stale source snapshot rather than silently copying different values. Reuse the existing company-wide number sequence and request-key deduplication. No schema change is needed.

Acceptance: any active approved user may copy an active or completed order. Copy all form details and item rows; use today in America/Chicago and the copying user as immutable creator. Reset status, Division, Purchase Order, Scheduled Job Date, assignments and all completion/void fields. Retain other notes and job details. Never copy attachments, emails, comments, notifications or old history; create one new copy event. Trash cannot be copied. Repeating an attempt must return the same copy.

Checks: synthetic development records covering active/Complete/Voided sources, reset/preserved fields, decimal items, creator, source immutability, excluded relationships, stale snapshot, inactive account, Trash, concurrent repeat requests and unique numbering. Check save-before-copy, failure feedback and busy protection in the browser; run focused lint and production build. Kent reviews the authenticated workflow.
