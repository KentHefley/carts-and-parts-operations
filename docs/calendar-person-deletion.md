# Calendar person deletion — October 14

Requested: retain Active/Inactive and add admin-only permanent name deletion from either calendar's settings. Both calendars share the same directory, so a deletion affects both.

Confirmed: delete events where the removed person is the only participant; retain shared events with that person removed. If they were primary, the next remaining participant becomes primary. Proposed confirmation shows affected saved events/series; deleted recurring exceptions must remain deleted, and changed exceptions must be checked too. Retain immutable audit history and original event titles/notes. Calendar person deletion must never delete an application login account.

Acceptance/checks: server admin guard; app confirmation with safe Cancel/Escape; stale-person and concurrent-event guards; active/inactive person deletion; both calendars/series exceptions; retain other people and event details; former primary-person handling; safe repeated submission; audit retention. No schema migration expected. No commits, pushes or deployment.
