# Custom sales-order fields

Status: implemented locally; authenticated employee review pending. October 15, 2026.

These rules supersede earlier unresolved custom-field details.

## Confirmed requirements

- Admin-only definition management through Add Sales Order Field; approved users edit order values.
- Optional types: text, long text, number, currency, date, time, dropdown, checkbox and employee selection.
- Choose an existing form section, move fields up/down among its fields, and preview before saving.
- Edit labels, help text, placement and dropdown choices without changing saved values.
- Change type only while a field has no saved values. Once used, create a replacement and deactivate the original.
- Copies retain custom values except employee selections, which clear like assignments.
- Print active custom fields with values in their form sections. Fixed SO emails, reports, exports and calculations remain unchanged.
- Deactivation removes fields from new entry and preserves existing values in a collapsed Inactive Fields section on the order.
- Permanent deletion requires confirmation showing affected-order count, removes current values and preserves labeled revisions in immutable history. Core fields cannot be deleted.
- Employee selection allows multiple active users without duplicates; it does not assign employees or send notifications.
- Currency accepts 25, 25.00 and $25 and normalizes automatically. It is available for future fields; no new currency field or conversion of existing price fields is requested.

## Plan and acceptance checks

1. Add versioned database definitions with stable keys independent of labels, and immutable configuration audit.
2. Build admin editing, placement, preview, activation and deletion controls; verify direct-request permissions.
3. Integrate dynamic rendering and server validation with order conflict protection. Test every type, blanks, invalid input and decimal-safe currency normalization.
4. Verify copy resets, inactive values, printing and readable labeled revisions after rename/deletion. Keep email/report selection unchanged.
5. Test competing settings changes, order-save/settings races, stale confirmations and retries. Include retained Trash orders in affected counts; prevent stale forms from recreating deleted fields.
6. Verify mobile/keyboard behavior, focused checks and production build before employee review.

No live migration, deployment, commit or push is authorized by this document.

## Implementation notes

Versioned definitions and their immutable audit are separate from order values. Custom fields have stable UUID keys. Core labels/help and within-section placement are configurable; their sections, types, choices and business behavior remain protected. Existing managed dropdown choices retain their separate screen.

Settings and custom-value mutations serialize with order saves/copies. Per-field revisions reject entry through stale definitions; the existing order-value conflict rules still apply. A field's used marker remains set after its values are cleared, requiring replacement for later type changes.

Currency uses authoritative Decimal(20,2) records, rounded half-up to cents; the exact canonical string is mirrored in order JSON in the same transaction for existing snapshots and deletion review. Copies preserve decimals; field deletion and expired whole-order cleanup remove those records. No custom currency contributes to report totals.

Print Saved Order opens an approved-user-only saved snapshot with fixed printable core fields and populated active custom fields, grouped by section. Inactive fields remain read-only and collapsed in Order Details. Printing does not silently save pending changes.

Deletion includes retained Trash orders and compares a review fingerprint of settings and current values before removing them. A tombstone prevents the deleted key from being reused, and immutable order history retains label/type/value revisions. Custom employee-selection changes do not trigger assignment or ordinary edit bells.

October 15 review correction: Edit (including reselecting the same field) and Add scroll/focus the editor below the fixed header. Changes enable Review & Save beside activation controls and in the toolbar. It opens/focuses the preview, which contains Save Layout; saving or failure brings feedback into view. Activation remains a pending change until explicitly saved. Every edit clears stale success feedback and requires a fresh preview.
