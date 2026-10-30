# Order board paging — October 29, 2026

Reviewed locally. Kent authorized and received the pilot release on October 29; see `pilot-order-board-release-2026-10-29.md`. Initial live launch remains separate.

- Both boards keep seven single-line data columns and their existing selection permissions.
- Consistent-height rows, ellipsis for long values, full values available on focus/hover. Only the order table scrolls, with sticky headings; filters and Load More stay outside it.
- Initial and subsequent database pages contain 50 orders. Search by Name/SO Number and Status filters apply to all matching saved records, including records not yet loaded.
- Preserve existing date ordering (Date Entered for open orders; status-change date for completed), with deterministic creation-time/ID ties. Use bounded cursor queries, never send the entire board to the browser.
- Every 15 seconds while visible/online, rebuild the loaded pages in the background without document navigation. Preserve table scroll, current filters and still-visible selections. Pause during bulk actions and confirmation; filter changes clear selections. Ignore superseded responses. Failures retain displayed data and offer retry.
- Keep bulk-copy request deduplication, per-order outcomes, creator/admin deletion rules and admin-only completed-board deletion.

Verification: development-only fixtures spanning >100 orders and date ties; full-database search, literal search characters, active/completed membership, cursor boundaries, insertion/deletion/reordering and inactive access. Browser checks cover scrolling/sticky headings/no wrapping, loading/search races, selection across pages, refresh and failures, mobile horizontal scrolling, keyboard/full-value access, and existing bulk-action controls. Run lint, types, production build and relevant order/selection regression tests.
