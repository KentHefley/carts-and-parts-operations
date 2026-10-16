# Development verification

October 15 field-editor regression: actual FieldSettings component tested with fake persisted actions and compiled CSS. Selecting the bottom field scrolled/focused its editor at 110px below a sticky header. Deactivate enabled adjacent Review & Save, focused the preview without writing, then Save Layout wrote inactive state and focused success feedback. Reload retained inactive state. No browser errors or 390px horizontal overflow. The fixture did not alter Kent's real field. Focused lint and final production build passed; Next diagnostics checked separately.

## October 15 custom fields

Run `npx tsx scripts/test-custom-fields.ts` against the guarded development target. It creates and cleans synthetic definitions, users, orders and notifications; it does not send emails. Covers types, decimal storage, permissions, copy resets, concurrent settings/value edits, persisted ordering, inactive/stale fields, deletion including Trash, and labeled audit retention. Related `npm run test:trash` and `npm run test:email` passed. Actual-component browser fixtures with fake actions verified add/type/section/preview/save, delete confirmation/Escape, custom-value Save Now, unique employee choices, checkbox interaction, and 390px layout without overflow. Print component visually verified with currency/names/false-checkbox and omitted inactive/empty values. Final production build and empty Next runtime/compilation diagnostics passed. Automated browser is signed out of the real app; authenticated review remains with Kent.

Employee review: add a test optional field, choose its section and position, preview/save, reload an order, enter/save/reopen its value, copy it, deactivate it and inspect Inactive Fields. Review the printed saved snapshot. Confirm ordinary users cannot open settings. Use a disposable custom field to test permanent deletion and retained labeled order history.

Latest October 12 list-policy check: regular users see no completed-list selection controls; admins can select and Trash but cannot bulk copy. Active-list copy/Trash controls and Dismiss label were verified in the isolated actual-component browser fixture. `test:selection` now verifies completed/voided copy rejection for users/admins and completed deletion rejection for creators unless admin. Prior completed-list copying checklists are superseded; opened-order controls are unchanged.

## October 12 order-list selection

`npm run test:selection` creates and cleans only its own guarded development fixtures. Checks copying/retry, terminal source, partial outcomes, creator/admin/inactive permissions, Trash retention/retry and invalid actions. Actual OrderList synthetic browser checks passed for selection, filtering, permissions, busy controls, partial failures/retry and completed-order confirmation.

Employee review: on each list select one order and several orders; verify count and Clear Selection. Filter by Name/SO Number and select all; confirm only visible results are selected. Copy and open resulting SO numbers to check resets. Move test orders to Trash, cancel once, then confirm and restore as admin. As a regular employee, select another creator's order and verify Copy is available while Trash is disabled; select only your own to delete. In-order Copy/Delete must remain available under their existing permissions.

## October 12 Copy Order

Automated: `npm run test:copies` uses guarded development credentials and creates/removes only its own synthetic records. Covers reset/preserved values, items, creator, excluded relationships, source integrity, repeated concurrent requests, stale sources, inactive users and Trash. Isolated OrderForm browser checks and focused lint/build/runtime checks passed; see progress.md.

Employee review: open an active order, edit a field and click Copy Order before autosave. Confirm a new SO number, your name as Submitted By, today's Date Entered and In Progress status. Check Division, Purchase Order, Scheduled Job Date, assignments and all closeout/void fields are blank; other details/items remain. Verify Files is empty and Activity Log contains only the new copy event. Return to the original and verify it is intact. Repeat with a completed order and a regular approved employee account.

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

## October 11 — Whole-order Trash

Run `npm run test:trash` for synthetic database/permission tests; `npx tsx scripts/test-trash.ts --r2` additionally verifies real development storage retention and permanent deletion. These commands check the exact development target and delete their own fixtures. Run database suites sequentially: ordinary notification fan-out makes concurrently active synthetic accounts interact.

Covered: creator/admin/noncreator/inactive access, exactly 30 elapsed days, repeated deletion without extending expiry, restoring the same status/items/assignments/files, inactive assignment flags, blocked stale saves and email/upload attempts, hidden lists/activity/file access, all-storage and partial-storage failure, resumable progress, minimal tombstone and removed related rows. Separate browser fixture exercised actual controls with fake actions for cancel/confirm, duplicate clicks, navigation and visible failure/success feedback. The real signed-out Trash route required login; unauthenticated maintenance returned 401.

Kent's authenticated employee check:

1. Use a disposable development order with an attachment; save any edits.
2. Delete Sales Order and confirm it disappears from active/completed lists and its old direct link no longer opens it.
3. Open Administration → Trash and verify previous status, assignments, file count and expiration.
4. Restore it and verify its SO Number, details and attachment still match.
5. Confirm a noncreator regular user cannot delete the order or open Administration/Trash.

Do not shorten retention on company orders for testing. Expiration and R2 removal are tested only through synthetic fixtures. Hosted daily scheduling remains unverified until configured and deployed with authorization; localhost has manual admin cleanup.

Price Books (October 12): npm run test:price-books and npm run test:price-books -- --r2 passed with synthetic two-page PDFs and temporary users; fixtures and object bytes removed afterwards. These lifecycle tests refuse databases with configured Price Books to avoid modifying company books. TypeScript, focused ESLint, production build and Next runtime probes passed. Actual UI components were browser-tested in an isolated synthetic fixture; authenticated full-app review remains.
Employee/admin review: Open Price Books, upload the matching original PDF under each tab as admin, set edition month/year, then View Book. Check page selector, Previous/Next, zoom, Close/Escape, download quality and tab switching. As a regular approved user, verify view/download and absence of upload/edition/cleanup controls. Try an invalid PDF replacement and confirm the current book remains available. Cleanup is manual in localhost; retry after 15 minutes for expired staging uploads.

Mobile Price Books follow-up: use View Book at 320px/390px phone widths and tablet widths. Check loading completion, Next/Previous, zoom, scrolling within PDF, Close/Escape, theme and admin file-input widths. Phone-emulated geometry was sampled repeatedly and remained stable after the layout fix. This does not replace testing on physical iOS/Android devices. Preview screenshots use actual UI components, uploaded metadata and local reference PDFs, with account/notification controls stubbed. Existing books were not changed.

Calendars: npm run test:calendars passed (model edge cases plus synthetic development database lifecycle, authorization, revision conflicts, retries and exceptions). Production build passed. Synthetic browser checks cover Sunday layout, people/category colors, overflow showing all five events, editor submission and regular-user controls. Mobile Month view scrolls horizontally; Day view offers more room. Full authenticated and physical-device testing remains.
Admin review: create an all-day multi-day event, select two people and a primary person, filter by each person, then test a weekly series with a single occurrence changed/deleted. Switch to the employee calendar and confirm category colors. Check Month/Week/Day and +N more, light/dark themes, and regular-user read-only behavior. Confirm no calendar event is created by changing Scheduled Job Date on an order. Repository-wide lint currently includes generated PDF.js and skill-template files; focused calendar lint must pass separately.

Reports (October 13): npm run test:reports passes model and guarded synthetic-development DB tests. Fixtures/accounts/items are removed afterward. Tests reconcile 2.5 × 12.34, per-charge half-up rounding, refunds, blanks, invalid text prices, large decimal values, normalized description grouping, order-total deduplication, inclusive dates, Voided/Trash/draft exclusions and admin/inactive access. Actual UI components were browser-tested with isolated sample orders; authenticated full-app testing remains.
Admin review: open Reports; run Sales by Date against known disposable orders. Search Products for a saved code/word and compare quantities/item totals against the order rows, then search Invoice Customer for its saved Invoice To text. Confirm all detail columns, date pickers, zero matches, paging, and clearly labeled subtotal exclusions. As a regular user confirm Reports is absent and /reports is denied. Exports are not yet implemented.

Report export verification (October 13): npm run test:reports now includes export tests. Workbook round-trip checks verify sheets/cells, numeric totals, exact large-number text and all 61 rows beyond the 50-row UI page; CSV checks quote escaping/newlines/formula-prefixed text; PDF checks multi-page US Letter, Unicode fallback and capacity rejection. Synthetic PDF page rendered and visually inspected. Sign-in protection checked on the actual download endpoint; guarded store tests deny regular/inactive accounts. Employee review: run each report, download each format, open in Excel/CSV reader/PDF viewer, compare totals and counts to the current report, and print a PDF page. Saved values are reloaded at download time, so rerun the screen if orders changed. Verify failed downloads show an app error and leave results visible. Full authenticated download/browser coverage remains unverified until employee review.

October 13 Excel compatibility fix: reproduced unreadable-workbook failures in installed Microsoft Excel 16.0 for all three synthetic report types. Cause: Summary was emitted with a frozen pane but zero frozen rows/columns, producing an invalid bottomLeft selection. Summary now uses a normal worksheet view; Products/Orders still freeze one header row. Corrected Sales/Products/Customer files all opened with Excel's normal object-model load (no repair/recovery), with expected sheets and sample order data. Six export tests passed, including XML pane checks across populated/empty reports. Focused lint passed. Fresh downloads are required; previously generated files are unchanged.

Product search follow-up: test cartwipes, handbaskets and cartwipes, hand baskets against saved item descriptions. Both queries match either term; quantities/product sales include only matching rows once, even if several terms match the same row. Customer searches keep literal commas. Twelve model/export tests pass, including overlapping-term deduplication and spacing variants.

October 14 deletion review: open Calendar Settings → Edit Person → Delete Person using a disposable name. Check impact counts, Cancel/Escape, single-person event removal, shared-event retention and primary reassignment on both calendars. Recurring exception tests verify sole-person occurrences are deleted while shared exceptions survive; original audit is retained. Database tests also reject stale previews and attempts to reuse a removed ID. Synthetic browser check confirms Escape cancels only the nested confirmation, leaving Edit Person open. Do not test against names/events you need to keep; there is no restoration.
# October 14 User Management checks

Access feedback regression: `npx tsx --test tests/access-feedback.test.ts` exercises the actual denial server page with isolated identity/navigation boundaries. Unapproved accounts see approval guidance; approved Users recover from stale generic denial pages, admin-only restrictions give Dashboard navigation, Admin recovers to Dashboard. Existing policy tests and production build passed. Read-only real development/Clerk diagnostic confirmed August is active User, verified primary email matches, accepted invitation links correctly and approvedAccess returns true. No account permissions changed. Kent should sign in as August and open `/` to verify Dashboard; admin URLs must remain restricted.

User deletion: `npx tsx scripts/test-user-deletion.ts` uses verified development data and fake provider only. Passed Super Admin permission, protected owner, stale edit, failure/retry/idempotency, non-reactivation and retained record checks. Existing access/policy tests, focused lint and build passed.

Kent: as Jack Admin, confirm ordinary active-access controls remain and no Delete User Account button appears. As Kent, use only a disposable test account for Delete User Account; cancel first to verify nothing changes, then confirm when ready. Expect collapsed Deleted Users, retained named order/history references and denied login. Kent must have no delete control. Failed provider deletion must remain inactive with Retry User Deletion visible only to Kent. Deleting is permanent through the app; rehiring/deletion delegation remain future work.

Invitation session guard: while signed in, open `/sign-up` or an unused invitation link. Expect “You’re already signed in,” Return to App, and Sign Out and Continue. Return to App must preserve the current session. Explicit sign-out must return to signup retaining the invitation; complete signup using the intended recipient. Signed-in flow requires manual review; automated helper tests verify ticket/status preservation and exclusion of arbitrary redirect URLs. Do not re-use an already accepted invitation for a fresh signup test.

Invitations: `npx tsx --test tests/invitation-policy.test.ts tests/user-management.test.ts tests/access-policy.test.ts`, `npx tsx scripts/test-invitations.ts` (guarded development database, fake provider/no emails), focused ESLint and production build passed. Test actual form confirmation/Escape/success with isolated fake-action browser fixture; real signup must be tested separately.

Kent: refresh Administration → User Management; Invite Employee → augustforum@gmail.com → confirm. Open email (also check spam) on this same machine while logged out of Kent/Jack, preferably in an incognito window. Complete Clerk signup with first/last name. Expect dashboard with User permissions; Kent can refresh User Management to see the named account and Joined invitation. Localhost links do not work from a separate phone/computer. Try cancellation using a separate unused approved test recipient; cancelled invitations must not grant app access. `INVITATION_ALLOWED_RECIPIENTS` in .env.local is a comma-separated exact recipient list; APP_URL defaults to http://localhost:3000. Changing these values requires a development server restart. Live invitation sending is intentionally not enabled.

Super Admin: log in as Jack Admin and confirm Kent shows Super Admin without editable role/active controls; Kent can still manage Jack. Direct server tests reject Kent demotion/deactivation even with multiple active admins and reject self changes. Development database check confirms Kent's account remains unchanged. The designation protects app access management, not external Clerk/company-service owner permissions.

Automated: `npx tsx --test tests/user-management.test.ts`, `npx tsx scripts/test-user-management.ts` (verified development credentials only), `npm run test:access`, focused ESLint and `npm run build` passed. The last-admin concurrency test simulates serialized transactions; database tests exercise actual development permissions and audit persistence without changing company accounts.

Employee review: Administration → User Management. Use a test account to change role, deactivate and reactivate; verify a subsequent protected request is denied while inactive. Confirm cancel saves nothing, two-tab stale changes show Reload, and Recent Access History identifies actor and before/after settings. Keep Kent as an active admin. Existing Clerk sessions are not revoked; app checks access on subsequent requests, and already issued short-lived file URLs expire normally.

October 15 list-refresh acceptance: in two accounts, leave Sales Orders open, create/save a named order in the other, and expect it to appear within approximately 15 seconds if it matches current filters. Repeat closing/reopening/deleting an order for the active/completed lists. Keep Name/SO/status filters and a checkbox selection through updates. Return from a hidden tab for an immediate update. Confirm open editor input remains untouched. Synthetic actual-component browser check verified timed updates add rows and retain Name filter, checkbox selection and scroll; timing policy tests cover visibility, offline, pause, focus deduplication and cleanup.

October 15 dropdown choices: npx tsx scripts/test-order-choices.ts uses temporary users/orders/choices in the guarded development database. Passed active-admin permission checks, normalized concurrent duplicate rejection, immutable history, idempotent/stale changes, unavailable new selections, retained inactive values, copies (Division still clears), reactivation and cleanup. Existing npm run test:orders passed. Synthetic actual ChoiceSettings browser check verified add/success, deactivation confirmation, Escape cancellation, inactive section, reactivation and mobile layout. No authentication bypass or real settings mutations in the browser fixture. Manual: Administration → Dropdown Choices, add a temporary choice, use it on a test order, deactivate it, reload the order, confirm its saved value remains and other fields save; confirm a new order cannot choose it; reactivate when done.

Dropdown reorder check: move a newly added Job Type above Other and reopen/reload a sales order to confirm the same ordering. Verify first/last disabled buttons, inactive choices skipped, keyboard operation and mobile wrapping. Extended scripts/test-order-choices.ts verifies both directions, persisted option order, concurrent/repeated stale rejection, inactive-neighbor rejection, boundary rejection and non-admin denial using only synthetic choices.

User grouping: npx tsx --test tests/user-display-sort.test.ts covers surname sorting over first-name order, equal surnames, whitespace, single names and missing-name email fallback. Manual: Administration → User Management, check Admins above Users and surname ordering; promote/demote a disposable account and confirm it appears in the appropriate group. Inactive accounts remain under their role, deleted logins remain separate. Only combined display names are stored, so sorting uses the final name word.

October 15 comments: npx tsx scripts/test-comments.ts passed author/admin permissions, inactive/wrong-order denial, concurrent creation deduplication, unchanged retry keys, mention/general alert distinction without duplicate/actor alerts, no edit/delete alerts, stale revisions, original-author/text audit, non-resurrection, 50-row pagination, excluded copies, Trash hiding/restoration and expired purge. Existing npm run test:trash passed. Synthetic actual-component browser checks cover plain-text HTML escaping, failed composer draft/mention retention, safe retry, edit draft retention on refresh, edited indicator and author controls. Authenticated two-account test: post mentioning Jack, verify Jack's distinct bell and another account's general comment bell; follow the bell to Updates, edit/delete your comment, verify no extra bells and audit revisions; other ordinary users must not see Edit/Delete for your comment.
Paging regression: deleting the last displayed comment between page requests must not skip older comments. Reproduced the offset-cursor problem and switched to a direct timestamp/ID boundary comparison; the extended guarded test verifies the same next-page IDs before/after deleting the cursor.
Comment recipient regression: tests now assign active/ inactive accounts explicitly, verify unrelated active users receive no general comment alert, and verify an explicitly mentioned unassigned account receives exactly one targeted alert. Assigned-and-mentioned users receive no duplicate.
