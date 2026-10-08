# Development verification

October 8 employee-name follow-up: Kent enabled required first/last names in Clerk and confirmed the existing test account's name appeared in assignments after its profile was completed and the app reloaded. This verifies existing-profile name capture and display. Required name entry during a fresh invited signup remains untested.

October 7, 2026. Use synthetic orders in the development environment. This app is not yet the company system of record.

## Order persistence checks

`npm run test:orders` passed against the verified development database: safe concurrent numbering, idempotent retries, initial defaults, Name validation, related item persistence/reopen, independent-field merging, competing-field/item rejection and audit deduplication. The script removes its own synthetic fixtures and never resets the number sequence.

`npm run build` passed TypeScript and production compilation. `npm run lint` passed with an existing warning in a skill example. Next.js runtime compilation diagnostics returned no issues. Approved-access policy tests passed in the preceding increment.

## Employee browser checklist — pending

1. Sign in using the approved employee account. Never share passwords or verification codes in chat.
2. Click New Order. Confirm an immediate DEV-prefixed SO number, In Progress status, blank Division and three item rows.
3. Enter a synthetic Name and optional form values. Confirm Saving changes to Saved.
4. Enter item description, quantity and unit price; add a fourth row. Confirm Saved.
5. Return to Sales Orders, search the SO number and reopen it. Reload and confirm saved values remain.
6. Open the same order in two tabs. Different-field edits should merge; competing edits should show a conflict without losing typed input.
7. Check narrow-screen usability and keyboard navigation. Verify input is retained after a failed save and retry works.

Authenticated browser testing confirmed New Order immediately generated DEV-000010, In Progress, blank Division and three rows. Name/Purchase Order and item values autosaved; a fourth row was added and the saved order appeared in Sales Orders. Testing exposed stale Saved feedback during item edits; corrected item edit/add handlers to show Unsaved changes immediately. The synthetic browser order remains available for review.

Kent subsequently supplied a Chrome screenshot of the reopened DEV-000010 with saved fields, then confirmed the saved item appeared and Chrome kept him signed in. Creation/save/reopen is therefore confirmed through agent testing plus employee verification. The Codex embedded browser repeatedly returned to sign-in; its cause remains undetermined, with no authentication error in its console. Do not weaken authentication or change session settings speculatively. Separate authorized accounts are still needed for inactive/unapproved browser denial checks. Password recovery/logout remain unverified.

October 8: expanded database checks passed invalid and impossible date rejection, unknown-field/unsupported-status rejection and invalid-item rejection. Rejected requests leave order values and audit events unchanged. Validation failures now return readable input feedback instead of surfacing as a connection failure. Chrome two-tab conflict testing is pending Kent's result; automated database field/item conflict checks pass.

Kent confirmed the two-Chrome-tab Purchase Order conflict displayed the expected warning and Retry Save/Reload Saved Values controls. Different-field browser merge and reload recovery are the next employee check. The October 8 production build/TypeScript passed after annotating invalid test patches; lint passed with the existing skill-template warning.

October 8 employee results: Kent confirmed Reload Saved Values restored TEST-A in both tabs. He then saved TEST-C as Purchase Order in tab 1 and entered a different Salesman in tab 2. Tab 2 received TEST-C while saving its Salesman; refreshing tab 1 showed the saved Salesman. Browser same-field conflict, reload recovery and independent-field merge are confirmed. This verifies the core create/save/reopen/edit workflow; offline-save recovery, narrow-screen checks and separate-account permission coverage remain outstanding before pilot readiness. Next implementation increment: assignments and bell notifications, with their scope and acceptance criteria documented before implementation.

## Assignment and bell checks — October 8

Expanded `test:orders` passed assignment uniqueness, inactive-user rejection/retention, removal, competing assignment-set conflict, idempotent assignment alerts, no self-alerts, rolling edit grouping and new alerts after reading. Fixtures and their notifications are cleaned up, including alerts addressed to existing accounts. Final build/TypeScript and lint passed (existing skill warning). Recipient ownership is enforced using the server-resolved approved identity for both list and read marking; callers cannot supply a recipient ID.

Employee Chrome check pending: select an account under Additional Information, confirm Saved and persistence on reopening, confirm selected account disappears from choices, remove and confirm active account becomes available again. Open bell panel and confirm opening alone does not mark read. A second approved account must test red unread count, assignment receipt, order links and mark-all-as-read; do not bypass authentication or create accounts without authorization.

Kent confirmed self-assignment removes him from available choices. No red bell is expected for one's own actions. Names now replace email labels when available; current approved Kent account uses Kent Hefley. Profiles without a name retain an email fallback until a display name is supplied. Bell is a compact 22px icon with red unread styling.
# October 8: second account for notification testing

Kent confirmed in two-user browser testing that the assignment notification arrived, displayed its message when opened, and clearing it as read removed the red bell indication. Signup name collection remains to be enabled in Clerk and verified with a new invited account; the existing test account has no profile name.

Verified jleo3140@gmail.com against Clerk's active, unlocked identity with a verified primary email and provisioned an active USER in the guarded development database. Read back its role and active flag. Clerk has no first/last name for this account, so its display name remains blank; no name was inferred from its email. Two-user browser notification delivery remains to be checked. Reproducible command: `npx tsx scripts/approve-test-user.ts`; it only approves this explicitly authorized test email and refuses permission changes to existing accounts.
