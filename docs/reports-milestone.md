# Reports milestone — October 13

First implement admin-only on-screen Sales by Date, Products and Invoice Customer reports. Verify calculations and filters before adding Excel/CSV/PDF downloads in the next step. No database migration or Monday import.

Confirmed today: product groups use full saved description ignoring case and repeated spaces; no inferred catalog aliases. Decimal round-half-up applies to each charge before summing. Order Subtotal includes repeatable item quantity × unit price plus manually entered Labor Price and Travel Price. Exclude Freight, NTE, AM and specialized legacy price fields pending their definitions. This is order value, not invoiced revenue or payment received.

Acceptance: inclusive editable Date Entered boundaries; Pending/In Progress/Expedite/Complete only, no Trash; case-insensitive contains matching; customer totals with matching orders; product quantities and matching item sales separate from full matching-order subtotals (each order counted once). Show all agreed detail columns with real values or an explicit blank marker. Reject invalid ranges, flag invalid numeric saved fields, and refuse partial totals if capacity is exceeded.

Verification: known synthetic totals including fractional quantities, rounding ties, negative values, blanks and malformed prices; status/date/Trash boundaries, product grouping and deduplication; admin/regular/inactive permission checks; focused lint, TypeScript/build and runtime/UI checks. Employee review remains part of acceptance. No commits, pushes or deployments.

Export milestone complete for employee review: XLSX, CSV and PDF share the existing report loader/calculations and enforce admin access. All matches included; no partial exports on capacity errors. Read latest saved values on each download (not a frozen screen snapshot). PDF caps and built-in-font fallback, spreadsheet injection protection, exact-number text preservation and verification are detailed in screens.md/testing.md. No hosted worker or migration needed.
