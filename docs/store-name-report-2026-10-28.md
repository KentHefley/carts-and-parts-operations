# Store Name report — October 28, 2026

Approved: add Store Name as fourth report. Require a case-insensitive contains search against saved Store Name (text_21__1), independent of Invoice To. Use existing inclusive Date Entered range, All/Open/Completed filters, Voided/Trash exclusions, admin authorization and subtotal definitions.

Acceptance: show matching orders, Store Name and combined Store Order Subtotal; preserve existing report behavior. Carry type/search/status/date through pagination and CSV/Excel/PDF downloads. Keep Invoice To visible in screen/export order details. No schema changes or pilot data edits.

Verification: matching/mismatching Store Name versus Invoice To, case/space handling, literal comma handling, empty search validation, all status scopes/date boundaries/exclusions, numeric totals, export labels/columns/formula safety and existing report regressions. Run development integration checks, lint, TypeScript, build and local UI/runtime checks. Pilot deployment is separate.
