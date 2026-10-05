# Carts and Parts Operations requirements

Agreed with Kent on October 5, 2026. These are requirements, not claims of implemented features. Unresolved details are in decisions.md. Preserve every existing Monday sales-order field; inventory and map them before implementing the form.

## Access and permissions

Access is invitation-only through Clerk using approved employee emails, email/password and password recovery. Disable public registration and social sign-in. MFA is deferred.

| Action | Approved User | Admin |
| --- | --- | --- |
| View, create, edit, assign, change status, and copy any order across divisions | Yes | Yes |
| Edit Complete or Voided orders without reopening | Yes | Yes |
| Read Activity Log, print orders, view/download attachments | Yes | Yes |
| Upload/delete order attachments | When assigned | Any order |
| Send SO Email or delete an order | Original creator only | Any order |
| Read/post comments | Yes | Yes |
| Edit/delete comments | Own comments | Anyone's comments |
| View/download price books; view both calendars | Yes | Yes |
| Replace price books; manage calendar entries and categories | No | Yes |
| Generate/download reports | No | Yes |
| Invite/deactivate users, change roles, manage dropdown choices and restore orders | No | Yes |

Use User and Admin roles. Deactivation preserves authorship and history. Employee records are separate from login accounts so calendar entries can include employees without access.

## Orders and persistence

- Name is free text and the only required field for saving or marking Complete. Whitespace-only names do not satisfy the requirement. Store number and SO number are separate fields.
- Default status: In Progress. Statuses: Pending, In Progress, Expedite, Complete, Voided.
- Sales Orders shows Pending, In Progress and Expedite. Completed Sales Orders shows Complete and Voided. Changing status changes view membership without copying the order record.
- All approved users may edit terminal-status orders without reopening them. Editing alone does not alter status.
- Autosave after a brief pause or field exit, with Saving/Saved/Couldn't save feedback. First persistence requires Name. Keep unsaved input on failure.
- Different-field concurrent edits can save independently. Same-field competing edits show a conflict rather than silently overwriting. Apply equivalent protection to repeatable item data.
- Date Entered defaults automatically on first save, remains editable and is the report date basis. Keep immutable creation timestamp separately.
- Submitted By is the immutable original creator. Salesperson and technician fields remain free text. Assigned To selects active app users and supports multiple people.
- Division starts blank on new and copied orders.
- Start with three item rows; users can add more. Preserve quantity, description and unit price for each row.
- Order total is the sum of quantity times unit price, plus labor, travel and other applicable charges. Do not equate order value with money received.
- Complete automatically fills Completed By/Completion Date. Returning to an active status clears current completion fields but preserves history.
- Voided automatically fills Voided By/Voided Date, with optional reason. Returning to an active status clears current void details but preserves history.
- One company-wide sequence, generated safely with uniqueness enforced. Deleted numbers are never reused. Reserve a higher live range than Monday; choose exact start later. Test numbering is separate.

## Copies and deletion

Copies get a new number, current Date Entered, copying user as creator, In Progress status and reset completion/void details. Assigned To, Division, Purchase Order and Scheduled Job Date start blank. Other form details and items carry over. Files, comments and history stay with the original; the copy has its own creation history. No assignment email is generated.

Only original creator/admin may delete an order. It moves to admin-only Trash for 30 days, hidden from regular views and reports. Admins can restore during retention. Cleanup permanently removes expired records and files while retaining a minimal audit entry: order number, creator, deleter, deletion time and purge time. Exact restoration and cleanup mechanics must be documented before implementation.

## Notifications, comments and audit

- Assignment generates a bell notification, never an email.
- Order field changes, new comments and file uploads/deletions notify all other active users; exclude the actor.
- Group nearby edits into one bell notification while logging each saved change.
- Comments support mentions of active users. Mention recipients get targeted bell notifications without email and without duplicate general comment alerts.
- Bell has unread count and mark-all-as-read.
- All approved users can view read-only order history; admins cannot alter it. Record actor, time, changed fields and previous/new values, status and assignment changes, file actions, comment actions and email sends.
- Comments show author/time and edited indicator. Users edit/delete their own; admins may act on others. Preserve original authorship, text and revisions in audit.
- Deleting an attachment/comment is permanent and cannot be restored. Keep file name and deletion metadata, not deleted file bytes; deleted comment text remains in audit. The 30-day Trash is for whole orders only.

## Sales-order email and printing

Only creator/admin can click Send SO Email. Send immediately without preview/confirmation to every current assignee. Disable if no recipients. Wait for pending autosaves before capturing sent values. Record sender, time, recipients, send outcome; distinguish provider acceptance from delivery and safely retry failures without duplicating successful sends. Show acceptance/success toast or failure/partial-failure feedback.

Use an explicit field selection; adding form fields must not expand email content automatically. Preserve blank labels and all item rows, including additional/unused rows. Do not attach uploaded files or include item/labor/travel prices.

Subject: SALES ORDER: [SO number].
Body fields, in current grouping:
- Date Entered, Division, Purchase Order, Scheduled Job Date.
- Salesman, Job Type, Priority, Terms, NTE, Price Level, Freight, Miles.
- Invoice To, invoice address/city/state/ZIP, Invoice Contact, Invoice Phone.
- Store Name, Store Number, Store Address/City/State/ZIP, Store Contact, Store Phone, Email.
- Description of Service; each item's quantity and description.
- Labor Description, Travel Description, AM Description.
- SO Additional Info, Submitted By.

Reference: user-provided SALES ORDER_email PDF reviewed October 5, 2026. The Gmail print header/footer is not part of the application template.

All users can print a clean layout with the same selected fields and blanks, or use browser Save as PDF. This single-order print feature is distinct from admin-only reports.

## Calendars

Both calendars are visible to every approved user across locations. Only admins add/edit/delete entries; changes are audited. Calendar is for manually entered management schedules; Scheduled Job Date never generates an event. Time off is informational, with no request/approval, accrual or balances.

Support Month (default), Week and Day, timed and all-day entries, multiple-day events and recurrence. Admins can change/delete one occurrence or entire series. Timed events display in event location's time zone with clear label; all-day dates do not shift by viewer time zone.

Time Off/Birthday Calendar categories: Time Off, Birthday, Work Anniversary, Holiday. Distinct colors and labels. Admins can add/rename/deactivate categories, preserving existing entries. Optional person/location filters are not decided.

## Price books and reports

Yellow, Blue and White retain only the current PDF. Admin replacements remove old bytes after new upload succeeds; log actor/time. All users view PDF in new browser tab or download.

Admin-only reports:
1. Sales by date range.
2. Orders containing selected products within date range.
3. Orders by invoiced customer within date range.

Use inclusive selected Date Entered dates. Include Pending, In Progress, Expedite and Complete; exclude Voided from results and totals. Exclude Trash. Product Description and Invoice To are free text with case-insensitive contains filters. Product report labels Matching Product Total and Full Order Total separately; count each order once in full-order aggregation even with several matching items. Matching Product Total is the matching items' quantity times unit price, not unrelated labor/travel/charges. Provide Excel, CSV and PDF exports, protect spreadsheet exports from formula injection.

## Validation before release

Verify permissions server-side, autosave/failure/conflicts, numbering concurrency, copies/resets, status metadata, notification grouping/mentions, email snapshots/retries, file retention/deletion, Trash expiry/restore, recurrence/time zones, printing and known report totals. Agree on field mapping and unresolved definitions before application implementation. No production launch, purchases, Monday changes or historical migration are authorized by this document.
