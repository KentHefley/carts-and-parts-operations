# Admin dropdown choices

October 15 follow-up: active choices support Move Up/Move Down. Swap with the adjacent active choice, skipping inactive rows, in an audited transaction. Check both row versions and adjacency to reject stale/repeated movements. No labels or saved values change; no schema migration required. Verify boundaries, both directions, permissions, stale/concurrent requests, inactive rows, rendered option order and mobile controls.

Scope: Terms, Freight-Shipping, Job Type and Division. Add, deactivate and reactivate immutable choice labels; keep existing order values, copy behavior, mapping keys and audit history. Status, Priority, Price Level and custom field definitions are outside this milestone.

Plan: seed the 25 agreed choices in an additive PostgreSQL migration; serialize settings changes and choice validation; pass current choices to the order form; provide admin-only settings and immutable audit records. Duplicate labels are compared ignoring case and repeated whitespace. New choices append to each list; no default choice is selected.

Acceptance: approved users can select active choices; only active admins can manage them. Deactivation prevents new selection but never rewrites saved orders. Historical/inactive selected values remain visible and can be retained while editing other fields. New selection of a stale/deactivated choice returns a friendly save failure. Copies preserve existing choices, except Division is cleared under the existing copy rule.

Checks: permission rejection, duplicate concurrent additions, repeated/stale changes, add/deactivate/reactivate, inactive-value retention, rejection of inactive/unknown new selections, unchanged copies and initial option ordering. Verify keyboard confirmation, feedback and active/inactive separation in the UI, plus lint, TypeScript and production build. Migrate only the guarded development target; no live deployment.
