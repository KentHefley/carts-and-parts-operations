# Activity and creator names — October 8

Implement Submitted By using the original creator's employee name, with email as a fallback for accounts without a name. Preserve the immutable creator identity.

Provide two read-only views of the same audit records: dashboard activity across saved orders, and activity filtered to one sales order. Dashboard entries identify and link to their order. Show recent entries first and provide older-page navigation. Both views require approved employee access and use the same readable change formatting.

Acceptance checks: another employee editing an order cannot change Submitted By; an order log excludes other orders; dashboard activity includes both; pagination does not duplicate entries. Run order regression, lint, build and runtime diagnostics. Authenticated employee visual verification remains necessary.

## October 8 refinement — less activity clutter

Dashboard history is opened through View Dashboard Activity rather than rendered on login. Autosave waits for three seconds without field/item/assignment changes; moving focus no longer triggers a separate save. Save now and form submission remain immediate, and unsaved-navigation/conflict protection remains.

Activity presentation groups consecutive ordinary saves by the same actor on the same order within 60 seconds of the latest event. Show earliest previous values and latest final values. Keep status/assignment events, different actors/orders, and older sessions separate. Preserve immutable raw audit events. Pagination must finish each displayed group rather than splitting it. Verify correction summaries, grouping boundaries, source-record preservation, pagination and existing order behavior.
