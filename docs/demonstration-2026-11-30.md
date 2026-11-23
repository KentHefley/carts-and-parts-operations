# Production demonstration — November 30, 2026

Kent requested no additional employee invitations until after this demonstration. Do not send invitations or SO emails as part of preparation. One production User account already exists for permissions testing. Pilot remains available separately.

## Before the demonstration

- Open https://operations.cartsandparts.com and sign in as Kent; verify the Production application rather than localhost or Pilot.
- Confirm the three price books open, calendar navigation works and no synthetic report orders remain outside Trash. Kent reported moving SOs 25000–25006 to Trash; numbers are not reused.
- Review GitHub's latest Daily encrypted production backup outcome; retain the recovery key separately from Dropbox.
- Have a clearly labeled demonstration order ready to create during the presentation. Use fictitious company/contact details, no employee assignments or real email recipients unless explicitly approved.
- Keep a regular User browser session separate from Kent's session if showing role differences. Never display credentials, invitation URLs or recovery keys.

## Suggested demonstration sequence (15–20 minutes)

1. Dashboard and Operations: explain open and completed boards, search, one-line rows, scrolling and Load More when needed.
2. Create DEMO — Training Only. Explain Date Entered, automatic SO numbering, autosave feedback, status and the order's sections. Enter a small quantity/unit-price example; leave and reopen to show persistence.
3. Explain assignments and bell notifications. Explain that Send SO Email is a separate explicit action and excludes prices; do not send during the demonstration unless Kent chooses approved recipients.
4. Upload/view a harmless sample attachment and show Updates/activity history. Explain private access and attachment retention on completion.
5. Complete the demo order using normal closeout controls. Find it on Completed Sales Orders and explain that approved Users can still edit completed records.
6. Open Reports as Admin: Sales by Date, Products, Invoice Customer and Store Name; Date Entered basis; All/Open/Completed filters; Excel/CSV/PDF. Explain that Voided/Trash are excluded and the displayed subtotal includes item charges + Labor Price + Travel Price, rather than a confirmed invoice/payment amount.
7. Open price books and both calendars. All approved Users can view calendars; Admins maintain entries. Only Super Admin manages blackout notices. Blackouts are notices, not enforced vacation-request approval.
8. Explain role boundaries: Users work with orders; creator/Admin can send SO email and move orders to Trash; Admins access Reports and user administration; Super Admin controls field/dropdown configuration and permanent login deletion. Deactivation blocks access while preserving company records.
9. Explain rollout timing and collect questions. Send no further invitations until after the demonstration and Kent's go-ahead.

## After the demonstration

- Move demonstration orders to Trash to exclude them from reports. Admin restoration is available for 30 days; order numbers stay used.
- Record blocking issues separately from optional requests.
- Confirm employees, roles, rollout date and official system of record before sending invitations. Monday.com history/export and subscription decisions remain separate.

## Verification already completed

Kent reported production save/reopen, attachment, explicit email, completion and Excel-open checks passed. Automated read-only reporting verification passed 28 scenarios and 84 generated exports plus 18 report tests. Kent confirmed the regular User can view calendars but cannot add/edit entries and cannot access Administration. Regular-user Reports access and any remaining order permission checks should be confirmed before full rollout. Initial production backup/Dropbox checksum and isolated restore passed; first hosted production backup run 45212418212 passed.

## Password policy

Kent confirmed saving the production Clerk minimum password length as 10 characters on November 23. Existing longer passwords remain valid. Keep compromised-password rejection enabled; its current toggle was not independently rechecked. MFA remains deferred.
