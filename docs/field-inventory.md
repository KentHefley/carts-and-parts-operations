# Sales-order field inventory

Reference review: October 5, 2026. This section inventories fields visible in the supplied screenshots/email, plus fields explicitly required by the agreed plan. Subsequent read-only verification of all five relevant boards is in `monday-field-verification.md`: it records all returned columns, source types, choices, formulas, and newly discovered fields. Its board evidence supersedes screenshot-only uncertainty about column existence/types/options below; it does not resolve unconfirmed business meanings. No application code or database schema is implied.

## Evidence and mapping conventions

- E: `Carts and Parts Mail - SALES ORDER_email.pdf`, one-page email sample, visually reviewed and text extracted. It verifies output labels, grouping, and blank item rows; it does not verify form controls or Monday column types.
- F: `file-attachments.png`, Files tab and order title.
- S: `Screenshot - 2026-10-05T104145.836.png` and `Screenshot - 2026-10-05T105134.704.png`, overlapping lower form views. These are not two different field sets.
- P: confirmed requirements in requirements.md and Kent's clarification. Plan-only fields are not verified as existing Monday columns.
- Email inclusion below follows the agreed explicit selection. A dash means excluded; Subject means subject only. New fields must not expand this selection automatically.

The Field column is a planning mapping, not a final storage key. Existing labels are retained separately where they differ. Control types, limits, dropdown values, and exact formulas need board verification unless explicitly confirmed below.

## Form and order fields

| Field / planned label | Reference label / evidence | Email | Confirmed meaning or remaining verification |
| --- | --- | --- | --- |
| Name | Order title in F/S; P | - | Free text; only required field. Verify Monday column label. |
| SO Number | SALES ORDER subject, E; P | Subject | Unique company-wide generated number; independent test numbering. Verify board label and current numbering. |
| Status | P only | - | Pending, In Progress, Expedite, Complete, Voided; new/copy default In Progress. Existing control not shown. |
| Date Entered | E/P | Yes | Editable report date; default on first save, today on copy. Use America/Chicago for defaults/report boundaries. |
| Division | E/P | Yes | Blank on new/copy. Full choices not verified; email shows one sample value. |
| Purchase Order | E/P | Yes | Clear on copy. Verify input type and formatting; do not infer numeric storage from sample. |
| Scheduled Job Date | E/P | Yes | Clear on copy; does not generate calendar events. Verify date-only versus timed input. |
| Salesperson | Salesman, E; P | Yes | Free text. Preserve mapping between Salesman and Salesperson. |
| Job Type | E/P | Yes | Service opens Service and Labor section. Full choice list not verified. |
| Priority | E | Yes | Label verified; complete choices/control not verified. |
| Terms | E/P | Yes | Admin-managed choices; full values not verified. |
| NTE | E; Kent clarification | Yes | Not to Exceed. Latest October 8 correction: free text, superseding the numeric request; no numeric/decimal validation. Calculation, units and enforcement remain undefined. Source Monday text column is retained in the mapping. |
| Price Level | E/P | Yes | Full dropdown values and relation to price books need verification; do not infer pricing automation. |
| Freight | E | Yes | Meaning, type, and calculation remain undefined. A sample value does not establish the available choices. |
| Miles | E, blank | Yes | Meaning, precision, units/rate application, and input type need verification. |
| Invoice To | E/P | Yes | Free text; report customer search uses case-insensitive contains. |
| Invoice Address | Inv. Add, E | Yes | Label mapping verified; limits/control not verified. |
| Invoice City | Inv. City, E | Yes | Label mapping verified; limits/control not verified. |
| Invoice State | Inv. State, E | Yes | Verify free text versus dropdown and accepted regions. |
| Invoice ZIP | Inv. Zip, E | Yes | Sample includes ZIP+4; preserve formatting. Storage type not confirmed. |
| Invoice Contact | E | Yes | Label verified; limits/control not verified. |
| Invoice Phone | E | Yes | Preserve phone formatting; input rules not defined. |
| Store Name | E | Yes | Separate from order Name and Invoice To. |
| Store Number | E/P | Yes | Separate from SO Number; verify formatting and leading-zero requirements. |
| Store Address | E | Yes | Label verified; limits/control not verified. |
| Store City | E | Yes | Label verified; limits/control not verified. |
| Store State | E | Yes | Verify free text versus dropdown and accepted regions. |
| Store ZIP | Store Zip, E | Yes | Sample includes ZIP+4; preserve formatting. Storage type not confirmed. |
| Store Contact | E | Yes | Label verified; limits/control not verified. |
| Store Phone | E | Yes | Preserve phone formatting; input rules not defined. |
| Email | E | Yes | Store-contact email in sample body; not automatically a Send SO Email recipient. Verify multiple-address support. |
| Description of Service | E | Yes | Label verified; control/length not verified. |
| Item quantity | Quantity 1, 2, 3, E; P | Yes | Repeatable item property. Three initial rows, more allowed; precision/negative-value rules undefined. |
| Item description | Item Description 1, 2, 3, E; P | Yes | Repeatable item property; product report uses case-insensitive contains. |
| Item unit price | P only | - | Required property of each repeatable row for calculation; actual Monday labels/control not shown. |
| Order Total | P only | - | Sum of each quantity times unit price, plus labor, travel, other charges. Not payment received. Current board field not shown. |
| Labor Description | E | Yes | Label verified; control/length not verified. |
| Labor Price | S/P; board text column | - | Manually entered amount, confirmed by Kent; not calculated from hours. Application money-input format remains to be designed. |
| Travel Description | E/S | Yes | Label verified; control/length not verified. |
| Travel Price | S/P; board text column | - | Manually entered amount, confirmed by Kent; not calculated from miles. Application money-input format remains to be designed. |
| AM Description | E/S; board text column; latest Kent clarification | Yes | Manual text field in labor inputs. Earlier AM/time interpretation is superseded; keep label and text control without inferring its abbreviation or a calculation. |
| Time In / Time Out | Verified board hour columns | - | Time inputs used to calculate Hours Worked. |
| Hours Worked | Verified board formula column; Kent clarification | - | Automatically calculated from Time In and Time Out; separate from manual Labor Price and Travel Price. Source formulas differ; edge cases require implementation review. |
| Other charges | P only | - | Total formula includes other charges; actual fields, labels, meanings, and repeatability not verified. No AM/freight charge assumed. |
| Additional Information | Additional Info, S; SO Additional Info, E | Yes | Explicit mapping of form and email labels; copy with form details. |
| Submitted By | E/S/P | Yes | Immutable original creator; copying user becomes copy's creator. |
| Assigned To | Forward to, S; P | - | Multiple active users; clear on copy. This is the planned mapping and must be checked against board columns. Current assignees receive explicit SO email. |
| Tech 1 | S/P | - | Separate free-text technician field; visible near lower crop. |
| Tech 2 | S/P | - | Separate free-text technician field; visible near lower crop. |
| Completed By | P only | - | Automatically recorded on Complete; cleared on active return. Existing Monday column not shown. |
| Completion Date | P only | - | Automatically recorded on Complete; cleared on active return. Exact date/time representation undefined. |
| Voided By | P only | - | Automatically recorded on Voided; cleared on active return. Existing Monday column not shown. |
| Voided Date | P only | - | Automatically recorded on Voided; cleared on active return. Exact date/time representation undefined. |
| Void Reason | P only | - | Optional; cleared with current void details on active return. Existing Monday field not shown. |

Each initial numbered quantity/description pair in E maps to one related item record rather than fixed database columns. Email preserves all rows, including blank and additional rows. Whether rows may be removed remains unresolved.

## Actions and related records

- Send SO Email is an action, not an editable data field. Save pending changes first; creator/admin only; send fixed body to current assignees. Gmail sender/recipient/header/footer are reference transport/print details, not order fields. Sender/reply-to/domain remain undecided.
- Files is an order-associated collection, with Add File and drag/drop verified in F. Required metadata: order association, original filename, storage key, size, content type, uploader, timestamp. Preview/download and authorized deletion are planned; no populated file list is shown. File search, grid/list toggles, and bulk download visible in Monday are not automatically approved replacement features.
- Updates and Activity Log tabs are visible in F/S. Comment content, mentions, revisions, audit entries, and notification behavior are confirmed in the plan but not demonstrated by these empty/cropped references.
- Copy/reset rules follow requirements.md: copy form details/items; new number/date/creator; clear assignment, division, purchase order, scheduled job date, and completion/void details; do not copy files/comments/history.
- Internal order ID, immutable creation timestamp, edit-conflict protection, email delivery records, audit events, deletion/expiry/purge metadata, and notifications are application integrity requirements. They are not claimed to be existing Monday fields.

## Verification still needed

1. Review source types and planned controls for fields in monday-field-verification.md. AM Description stays manual text; Time In/Out are time inputs and Hours Worked is calculated. Do not require abbreviation definitions or inferred business meanings to preserve ordinary fields.
2. All returned board columns/types/options/formulas are recorded in monday-field-verification.md. Final business mapping, hidden/visible form presentation, defaults/automations, duplicate-column reconciliation, and source-field preservation still need review. No migration is authorized.
3. Resolve calculation inputs only where necessary for the agreed totals, plus numeric precision/rounding and Hours Worked edge cases. Labor Price and Travel Price are manual. No AM time format or abbreviation clarification is needed.
4. Exact copy mapping after the full inventory; no extra resets beyond the confirmed list.
5. Company logo asset and wireframe/mockup review. Existing Monday layout is evidence of current work, not approval to replicate all Monday controls.

## Additional approved decisions

Kent explicitly approved all six on October 5, 2026. These are confirmed requirements.

| Question | Approved rule |
| --- | --- |
| Complete to Voided | Clear current completion details, record void details, retain both events in history. |
| Voided to Complete | Clear current void details, record completion details, retain both events in history. |
| Restore an order | Keep previous status/assignments; flag now-inactive assignees. |
| Date Entered/report boundaries | America/Chicago. Scope of audit display remains to be decided. |
| Blank versus zero | Preserve blanks in form/email; use zero for missing optional amounts in totals. |
| Money rounding | Decimal arithmetic; round each calculated charge to cents, then sum rounded charges. |
