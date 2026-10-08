# Development verification

## October 8 shared date picker

Two date-only tests passed for leap-day/DST-boundary round trips, display formatting, blanks and impossible dates. Lint passed (one existing skill warning), production build/TypeScript passed, and runtime compilation returned no issues. An isolated local fixture mounted the actual DateField component with production CSS and no application data/authentication: mouse selected 10/09/2026 and yielded 2026-10-09, Enter/ArrowRight/Enter selected 10/10/2026, Escape closed the popover, and Clear date yielded blank. Accessibility scan on the popover found zero violations, with weekday contrast needing manual review. Browser fixture artifacts were removed. This verifies the component, not authenticated app persistence or every browser engine.

Employee checks: refresh the app; click Date Entered, Scheduled Job Date and Closed Out Date, pick dates and wait for Saved. Reload and confirm values. Confirm Escape closes without changing a value and selected dates are correct in employees' browsers/time zones. Verify Firefox, Edge and Safari, including mobile where used; no cross-browser pass is claimed yet.

## October 8 closeout review corrections

Kent confirmed Mark Complete moved the test order to Completed Sales Orders and changing it to Voided worked. Required-field browser validation was not tested. Kent reported reopening did not appear to restore Sales Orders membership. Read-only inspection found DEV-000010 saved as In Progress with cleared void metadata, and the exact list queries returned it in Sales Orders and excluded it from Completed Sales Orders. The cause of the reported visible discrepancy is not proven. Returning to lists now performs a fresh server navigation instead of reusing a cached client route. Employee verification of this correction remains pending.

Activity Log item values now show a table of changed Description/Quantity/Unit Price values by item number, with blank values represented by an em dash and added/removed rows recorded explicitly. No historical records were rewritten. Three formatter tests passed using Kent's reported historical payload, blank row additions/removals and assignment-name formatting. Lint passed with the existing skill-template warning. Final production build/TypeScript passed. Authenticated UI verification remains pending in Kent's Chrome.

## October 8 closeout checks

Database regression suite passed required/blank closeout validation, server-only metadata, Complete/Voided transitions and reopening, terminal editing without metadata reset, repeated-save audit deduplication, stale competing status rejection, preserved identity/items/assignments, historical events and active/completed list membership. Access-policy tests: 3 passed. Lint: zero errors, one existing skill-template warning. Production build and TypeScript passed; Next.js runtime compilation issues: none. Signed-out Completed Sales Orders redirects to sign-in. Authenticated UI checks remain pending in Kent's Chrome; the isolated agent browser is signed out, so no authenticated UI pass is claimed.

Employee checklist: use a synthetic order. Try Complete from the status box with missing closeout inputs; it must remain active. Fill Closed Out By/Date and Mark Complete; wait for Saved, then open Completed Sales Orders and find the SO number. Edit/reload it while Complete; automatic timestamp must remain unchanged. Mark Voided with an optional reason; completion metadata must clear. Set In Progress from the status box; void metadata/reason must clear and the order return to Sales Orders. Activity Log must retain each status event.

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

## Creator names and activity views — October 8

- Refresh an existing order: Submitted By should display the creator's name. A different editor must not become Submitted By.
- Edit two different orders. Dashboard Activity should identify both by SO Number/name and link to each.
- Open each order's Activity Log: only that order's events should appear.
- Use Older activity and Newest activity; check for duplicate entries and readable item changes.
- Automated development database regression verifies creator names, activity scope and pagination. Lint/build passed; authenticated visual checks remain pending.

Runtime follow-up: Next.js reports no compilation issues. The isolated browser correctly redirects unauthenticated `/activity` requests to sign-in. Runtime diagnostics also captured a hydration warning in an existing order browser session involving extra `fdprocessedid` attributes on inputs/buttons, consistent with browser-injected attributes; the source has not been confirmed. No authentication bypass or suppression was added. Visual review of the authenticated activity screen remains pending.

## Activity clutter / delayed autosave

Refresh the landing page and verify only View Dashboard Activity appears. Type continuously: Saved should appear after a three-second pause, not while typing or immediately on tabbing to another field. Save now should remain immediate. Correct a typo within one minute: activity should summarize original → final. Change status or assignments: each remains a separate event. Verify old activity pages do not split summaries. Formatting/grouping unit tests verify original/final merge, separate actors/orders/status/assignments/time windows and raw-event immutability.

## Approved styling review — October 8

1. Refresh `/`: Dashboard should show the company logo, sidebar, navigation cards and your active assigned orders. Sales Orders opens `/sales-orders`.
2. Switch light/dark mode, navigate and refresh. Check theme and logo variant persist. Collapse/expand navigation and refresh.
3. Open an order. Make an edit and immediately click Dashboard or View All Activity: remain in the form with visible unsaved feedback. After Saved, navigation should work.
4. Verify Completed Sales Orders, All Activity and each order log use the same theme and keep their existing scope.
5. On a phone/narrow window, open Menu, use Escape to close, and check form/table scrolling. Test Edge, Firefox and Safari as available.

Automated/isolated results: order regression passed; lint/build passed; actual UI component fixture in Chromium verified light/dark appearance, collapse, mobile Menu/Escape/focus return, 390px page width without overflow, and delayed autosave/navigation protection. The fixture used synthetic data and stubs for authentication, notifications and persistence; live signed-in visual/persistence checks remain pending.
Connected isolated-browser runtime diagnostics returned no configuration or session errors. This covered the sign-in redirect; signed-in application review is still pending.

## Order controls — October 8

Refresh the order as creator/admin: Send SO Email should appear beside Add employee, disabled, with Email setup pending. An ordinary user who did not create the order should not see the send control. Switch Details → Activity → Details; tabs and header should remain in the same place, with the active view highlighted. Scroll to confirm the bar stays visible. Pending edits should still block navigation until Saved.

Isolated Chromium component check passed disabled placeholder and identical tab bounds/active labels on both views; actual authenticated permission visibility and sticky behavior remain employee checks. No delivery tested or attempted; Resend setup is next.
# October 8 — Resend development email

`npm run test:email` runs template/allowlist tests and guarded synthetic database checks with mocked transport; it sends no real email. Covers escaping, blanks/extra item rows, price exclusion, creator/admin permission, inactive admin rejection, stale snapshots, concurrent duplicate queue/send requests, timeout/retry, immutable content, accepted-message deduplication and expired retry refusal. Fixture cleanup removes only its generated records and notifications.

One explicitly invoked real synthetic send was accepted by Resend: DEV-000069 to kent@cartsandparts.com. The order and email audit are retained for review. Provider acceptance does not prove inbox delivery. Check inbox/spam and review formatting before wider use.

Isolated browser component checks used real OrderForm/EmailToast with mock actions, without bypassing app authentication: save precedes send; saved edited value appears in snapshot; failure shows Retry SO Email and no confetti; retry success shows toast; reduced motion hides confetti; dark theme uses the correct colors. Authenticated Chrome button-to-server test remains Kent's manual check. Next.js runtime probe reported no compilation/config/session errors on the sign-in redirect. Production build and lint passed (one pre-existing skill-template lint warning). Existing order regression checks passed.

Employee check: refresh localhost, open the synthetic order (or another synthetic order you created), assign only Kent, edit a field, click Send SO Email, verify Saved followed by acceptance toast/confetti and correct email content. Try an additional test assignee: sending must reject the non-allowlisted address. Assignment alone must never send email.
# October 8 — NTE and compact email correction

NTE browser checks: input type number with step=any accepts 94 and 94.567 without trailing-zero formatting. Synthetic database order checks exercise 94, 94.5, 94.567 and blank persistence and reject nonnumeric text. Template escaping/selection tests retain all labels and item rows and exclude prices. Compact email preview printed to one US Letter page (612×792 points), with a simulated email print header; visually checked for readability and clipping. Long notes/additional rows remain allowed to overflow.

Verification completed: order regression checks (including NTE), email-template tests, lint and production build passed. One existing skill-template lint warning remains. Restarted Next.js reported no compilation/config/session errors on the authenticated-route sign-in redirect. Localhost is running; actual email-client printing remains Kent's manual check.
# Latest October 8 — Closeout bug review

Synthetic database order checks passed with free-text NTE and explicit closeout-validation results. Manual closeout name/date remain distinct from automatic completion actor/time; missing inputs cannot change the status. The actual OrderForm was exercised in an isolated browser bundle with mocked save actions: Closed Out By accepted typing; Mark Complete and Status → Complete both displayed a warning inside Completion without auto-filling required fields or changing status; dismiss X removed it and returned focus to the input. Choosing a date and entering a name allowed completion. Keyboard-clearing Closed Out By on the completed form, then Save now, displayed the local warning without a global conflict or disabled input; entering a replacement name saved and cleared the warning. NTE accepted free text.

The browser fixture sends no email and bypasses no application authentication; authenticated Chrome remains Kent's final employee check. Temporary generated fixture files were removed before lint. Earlier numeric-NTE tests and notes are superseded by this correction.

Final checks: order regression suite, lint and production build passed; lint retains only the existing skill-template warning. Restarted Next.js reported no compilation/config/session errors on the authenticated-route sign-in redirect. Localhost is running.
# Final October 8 — Two closeout paths

Order regression suite passed: manual Complete/Voided requires entered name/date; quick mode supplies the authenticated actor and today's Chicago date; browser-supplied actor/date cannot override them; repeated quick requests add no event or change recorded values; notes and quick-void reason survive. A quick-mode request for an active status is rejected. Isolated OrderForm with mock save actions confirmed bottom Mark Complete rejects blank details while Status → Complete fills them and saves promptly without a warning; Status → Voided preserves the entered reason and notes. Temporary fixture files were removed. Actual authenticated Chrome remains Kent's final review.
