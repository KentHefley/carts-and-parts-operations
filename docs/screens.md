# Screen and styling plan

Agreed direction, October 5, 2026. This is a browser-based responsive web app. Screens described here are planned, not implemented. Review wireframes and styled mockups before application development.

## App shell and navigation

October 14 access feedback correction: distinguish approved Users opening admin-only pages from unapproved/inactive employees. Admin-only denials show Administrator access required and Go to Dashboard. An approved account opening an old generic approval screen returns to Dashboard. Server permissions remain enforced.

Carts and Parts logo; collapsible left sidebar on large screens, icon tooltips when collapsed, remembered user preference. On phones use a collapsible navigation menu. Top bar contains page title, notification bell, light/dark toggle and user menu. Remember theme preference.

The bell is red when unread notifications exist and displays an unread count. With no unread notifications, show a neutral bell. Provide an accessible unread-count label and Mark all as read action; opening the panel alone does not clear unread notifications.

Navigation: Dashboard, Sales Orders, Completed Sales Orders, Price Books, Calendar, Time Off/Birthday Calendar. Admins also see Reports and Administration; Trash is inside Administration. Enforce permissions on the server, not solely navigation.

Use neutral readable backgrounds with blue primary accents and orange-yellow selected buttons/highlights. Distinguish destructive actions. Exact colors, logo asset, typography and component treatment await mockup review. Support both light/dark contrast, keyboard access, readable tables and form labels.

## Dashboard

Landing screen after sign-in. Navigation cards for the five primary sections; admin cards for Reports and Administration. Orders Assigned to You lists only assigned Pending/In Progress/Expedite orders. Opening one opens its form. No calendar updates or schedule widgets.

## Order lists

Latest October 12 correction: Completed Sales Orders hides all selection checkboxes/actions from regular users. Admins see selection, Move Selected to Trash and Clear Selection, with no Copy Selected. Active-list controls remain unchanged. Result dismissal is labeled Dismiss.

October 12 implementation: a checkbox column appears on active and completed lists. The header checkbox selects current displayed results and shows partial selection. Selected rows reveal a toolbar with count, Copy Selected, Move Selected to Trash and Clear Selection. Mixed-ownership selections disable Trash for non-admins with explanatory text. Filter changes clear selection. Actions run sequentially with progress and per-order results; copies link to new numbers. Successful items leave selection; failed items remain for retry. Deletion uses the shared app confirmation and retains order files for 30 days.

Sales Orders contains active statuses; Completed Sales Orders contains Complete/Voided.
Columns: SO Number, Name, Status, Division, Job Type, Scheduled Job Date, Assigned To.
Every result row displays its order values in all seven columns. Show an em dash for blank optional values; do not leave ambiguous empty cells. SO Number is visibly displayed and can open the order.
Search by Name appears at the top of the fields and matches Name only. A separate SO Number search precedes Status. Store Number and Purchase Order search are omitted, per Kent's October 7 correction.
Filters: Status, Division, Job Type, Assigned To, Scheduled Job Date.
Kent's October 7 review: Search by Name is the top field; put the dedicated SO Number search before the Status filter below it. Apply this order to both active and completed order lists.
Sortable column headings toggle ascending/descending. Active default: newest Date Entered first. Completed default: latest completion/void event first. Preserve query, filters, sort and position when closing form.

Compact table; no inline field editing. Click order to open wide slide-out form on larger screens; full-screen form on mobile. Direct order navigation/link behavior remains to be specified.

## Order form

October 12 implementation: Copy Order appears beside Save now for all approved users on active and completed orders. It saves pending changes, checks the source snapshot, creates the copy, and opens its form. While copying, form inputs and competing actions are disabled; errors are shown in the app. Navigation mounts fresh form state for the new order.

Tabs: Order Details, Files, Updates, Activity Log.

October 8 clarification: editable dates open a small calendar when the field is clicked. Date Entered, Scheduled Job Date and Closed Out Date use the shared picker, with month navigation, selection, clearing and keyboard access. Automatic completion/void dates remain read-only. Kent also requested an order-specific activity view while the order is open and an activity feed across orders on the dashboard; the latter is pending implementation.

Clicking Order Details returns to the top of the order form, including when Order Details is already selected. In the working slide-out form, scroll its content area rather than the underlying order list.

Status is a color-coded box with a clickable choice menu, not a native select dropdown. Show the status label as well as color. Exact color assignments await styling review. Division offers Oklahoma City, Dallas/Fort Worth, Houston, San Antonio, Phoenix, Cleveland and Corporate, retaining a blank selection on new/copied orders.

Assigned To shows selected employees with individual remove actions and a dropdown containing only unassigned active employees. Selecting a person removes them from that dropdown; removing them from Assigned To restores their availability. Do not show Monday Item ID as an employee-facing field.

New Order immediately generates and displays a unique SO Number in the read-only field, before Name entry. The working app allocates it from the company-wide sequence server-side; the wireframe uses an isolated DEMO sequence.

Completion: the bottom Mark Complete and Mark Voided buttons require entered Closed Out By and Closed Out Date; ordinary draft saving still needs only Name. Put these buttons underneath the fields. Status → Complete/Voided is a quick close that supplies the signed-in employee and today's closeout date automatically. Both paths route the record into Completed Sales Orders. Omit the Legacy Voided checkbox.

Latest October 8 closeout clarification: keep Closed Out By editable and clearly separate closeout inputs from automatic completion/void records. The bottom buttons validate entered name/date and show a dismissible warning with an X beside these inputs when missing. The Status menu instead supplies the employee name and today's date and closes promptly. Explain the distinction beside the controls. Missing-closeout validation must not appear as a global save-conflict banner or lock editing. NTE remains a text field.

Use plain field labels in Service and Labor: Labor Price, Travel Price, AM Description, Freight and Hours Worked. Do not append implementation annotations such as manual, text or calculated. Document input types and calculation behavior separately; Hours Worked remains read-only and calculated.

Detail section order:
1. Order Overview
2. Billing and Store Information
3. Items and Pricing
4. Additional Information
5. Completion
6. Service and Labor

All Monday fields must be mapped before implementation. Name is free text and the sole required field. Assigned To and Send SO Email sit near Additional Information. Preserve separate free-text Salesperson/technician fields.

Service and Labor starts collapsed; selecting Service as Job Type automatically opens it. Users may expand for any type. Collapsing never deletes values. Start with three item rows and Add Item. Display autosave status and conflicts. Creator/admin email and delete controls; all-user print and copy controls. Email success/failure toast; no send confirmation/preview.

Files: Add File and drag/drop, file list with preview/download, uploader/time; upload/delete available only to assignees/admins. Updates: comments, mentions, authored edit/delete controls and admin moderation. Activity Log: read-only chronological history available to all approved users.

## Price Books

Yellow, Blue and White tabs select one book in a shared in-app PDF viewer. Include page navigation and zoom, a separate Download action for all users, and admin-only Replace PDF. Display last-updated date from upload metadata. Do not open a separate browser tab or automatically download on viewing. No past-version browser. This supersedes the earlier three-card/new-tab plan.

View Book opens an in-app overlay containing the selected PDF, a direct page selector, previous/next page controls and Close. Support Escape, focus containment and return focus to View Book on close. Replace PDF is visible only to admins and replacement authorization is enforced server-side. The role switch in the mockup is a review aid, not a production feature; production roles come from the authenticated account.

Display an admin-editable edition month/year beside the page count. Users can read the date; only admins can edit it. Keep the automatic upload/replacement timestamp separate. The production viewer uses the original PDF with sharp rendering at each zoom level, rather than the compressed images used in the mockup.

## Calendars

Calendar for management schedules; Time Off/Birthday Calendar for informational employee events. Month default plus Week/Day. Everyone sees all events. Admin entry/edit/delete/recurrence controls. Event local time-zone labels, stable all-day dates. Employee calendar categories have color plus visible text.

Month/Week day boxes use full-width, single-line event bars with ellipsis for long titles, following Kent's reference. Do not wrap event titles or crowd boxes with secondary details. Full title, time/time zone and event details remain accessible on hover/focus/tap and in the event overlay. Show a +N more control on crowded days, opening the day's events. Keep separate clickable bars so users can identify which event they are opening.

## Reports (admin only)

Date Entered range controls, product-description and Invoice To contains searches, results and clearly labeled totals. Excel/CSV/PDF exports. Exclude Voided and Trash. Product reports show both matching product value and whole-order value without duplicate order totals.

## Administration (admin only)

User deletion: Super Admin sees Delete User Account on other current accounts, with an app confirmation explaining permanent login deletion and retained company records. Pending deletion shows blocked access and Retry User Deletion only to Super Admin. Completed deletions move to a collapsed Deleted Users section with no role/access controls. Other admins retain ordinary role and active-access controls on eligible accounts; they never see deletion controls. Recent Access History includes deletion request, unconfirmed outcome and completion events.

Invitation safety: `/sign-up` renders an already-signed-in message instead of mounting Clerk signup when a session exists. Return to App preserves the current login; Sign Out and Continue preserves only Clerk's invitation ticket/status and returns to signup. No automatic sign-out or invitation acceptance.

Employee invitations: email form with app confirmation, latest 50 requests in a collapsed Invitations panel, Check Status and Cancel Invitation (retry cancellation if provider cleanup fails). Distinguish provider acceptance from inbox delivery and uncertain outcomes. Invited employees sign up at `/sign-up`, then verified acceptance creates User access. Development links use configured APP_URL; localhost links work only on the same machine.

Kent's protected account shows Super Admin with an explanation instead of editable role/active controls. Protection is enforced server-side even for direct requests.

October 14: User Management lists approved accounts by name/email, current role and active status. Explicit Save Access opens an app confirmation. Show save failures and Reload for stale settings. Recent Access History is collapsed initially and shows the latest 50 changes in America/Chicago. Last-active-admin removal is blocked server-side. Calendar people are separate; invitations are available as described above.

Use Add Sales Order Field as the navigation button label for field configuration, per Kent's review. This screen also provides admin-only editing of existing field definitions.

- User invitations, deactivation and User/Admin roles.
- Employee directory including employees without accounts.
- Dropdown choices (Division, Job Type, Terms, Price Level and other mapped choices): add/change/deactivate, preserve existing values.
- Calendar categories: add/rename/deactivate.
- Trash: deletion time, expiry, restore within 30 days, minimal retained audit after purge.

October 11 implementation: Administration links to admin-only Trash, showing SO Number, Name, previous status, assignments (including inactive flags), file count, deletion and expiration timestamps in America/Chicago. Trash is paginated in groups of 50. Restore Order appears only before expiration; expired/purging rows show cleanup pending. Clean Expired Trash retries eligible permanent cleanup without deleting unexpired orders. Creator/admin sees Delete Sales Order below the order form; save pending changes before deleting. Order tabs are Order Details, Files, Activity Log while Updates remains unimplemented.
- Price book replacement may be accessed from its cards.
Detailed administration layouts and how employees map to user accounts remain to be designed.

October 8 implementation: the current Sales Orders landing page includes Dashboard Activity with linked SO Number/name, newest entries first, and older-page navigation through `/activity`. An order's Activity Log shows only that order. Both use readable field/item changes and explicit UTC timestamps. The broader dashboard layout described above remains planned.

October 8 refinement supersedes the inline activity display above: show View All Activity in the top navigation on Sales Orders and Completed Sales Orders. `/activity` opens the paginated All Activity feed. Both activity views summarize short consecutive ordinary editing sessions and keep status/assignment events separate.

## October 8 styling implementation

Shared sidebar/topbar, logos, theme toggle and mockup color/spacing styles now cover Dashboard, active/completed lists, routed order forms and activity screens. Theme and collapsed navigation preferences persist per browser. Dashboard is `/`, Sales Orders is `/sales-orders`. Current Dashboard cards mark unimplemented sections as Coming later; admin cards/navigation depend on approved role. Assigned orders are restricted to the current user's active assignments. Full order slide-outs and remaining sections are still pending.

October 8 order-control refinement: Order Details and Activity Log share the same sticky left-aligned navigation on both views, retaining the order header and selected-tab styling. Creator/admin sees a disabled Send SO Email placeholder beside Add employee while Resend setup is pending. No messages are sent in this milestone.

October 10: Same as Invoice checkbox and explanatory text appear at the top of Billing and Store Information; copies six fields into Store information once, preserving editability.

October 10 placement refinement: Store Same as Invoice appears immediately before Store Name, spanning the grid width so Store fields begin together on the next row. Copy behavior is unchanged.

October 10: Successful SO email toast/confetti dismisses after five seconds or when clicking the order form. Error toasts retain manual dismissal.

October 11: Order deletion, file deletion, expired Trash cleanup and Reload Saved Values use themed in-app confirmation dialogs. Cancel receives initial focus; Escape cancels and focus returns to the trigger. Pending actions disable controls and prevent dismissal. Confirmed Reload Saved Values skips the additional browser unload warning.

Price Books implementation (October 12): /price-books now provides the approved tabs and original-PDF overlay. Admin controls include edition month/year, upload/replace, pending-upload verification and pending-storage cleanup. Regular users receive View Book and Download PDF only. Upload timestamp remains automatic and distinct from edition.

Calendar People filter: selected employees appear as removable chips outside the dropdown. Clear Filters returns to all people; no separate All People button. Removing a chip also unchecks that employee in the dropdown. Existing OR matching remains.

Calendar filter usability: People closes on outside click/touch, keyboard focus leaving the dropdown, or Escape (which returns focus to its summary). Inside selections keep it open. Grid time zone sits at the right of the desktop filter row and takes its own full-width row on phones.

Calendar Settings layout refinement: use separate bordered People and (employee-only) Event Categories sections, each with its Add button alongside its heading. Rows display a color swatch, name, active/inactive label and a consistent right-aligned Edit button with a named accessibility label. Existing permissions and settings behavior are unchanged.

October 13 Price Books admin layout: separate bordered Edition Date and Upload/Replace PDF sections with aligned inputs/actions. Awaiting Verification appears only when needed. Maintenance is collapsed by default and explains that cleanup covers all three books. Existing upload, publication, edition and permission behavior is preserved.

October 13 Reports implementation: admin-only /reports with Sales by Date, Products and Invoice Customer. Filters submit explicitly, use the shared date picker, and remain in the URL. Default range is current Chicago calendar month through today. Detail columns show SO Number, Name, Date Entered, Invoice To, Status, Division, Job Type, Scheduled Job Date, Assigned To, Order Subtotal and numeric-data review notes; Products adds Matching Product Total. Fifty matching orders per page, newest Date Entered first; summary totals cover all matches. Product summaries scroll independently. Ranges over 5,000 eligible orders are rejected with no partial totals. On-screen reports precede export implementation/review.

October 13 downloads: results now provide Download Excel, CSV and PDF with preparation/error feedback. Each download enforces admin access, validates the original filters, reloads latest saved records and includes all matching rows rather than the current screen page. Excel has Summary, Products (product reports) and Orders sheets with frozen headers and filtering. CSV contains those sections in one UTF-8 file. PDF uses US Letter portrait, wrapped product/order details, filters/definitions, totals and page numbers. PDF limits: 500 orders, 2,000 product groups, 500 pages; oversized requests explain how to narrow the range or use Excel/CSV. Excel preserves values beyond 15-digit precision as text. Formula-like text is escaped in spreadsheet outputs. Downloads are private/no-store.

October 13 PDF styling approved: match the earlier sample reports with the company logo, centered blue report titles, compact shaded summary tables, alternating rows, right-aligned money and prominent subtotals. Full order details follow on separate pages so all existing information is retained. Repeat table headers on continuation pages; wrap long values rather than truncate. Headers repeat the selected date/search/status criteria; footer shows generation time and page count. Calculations, Excel/CSV and permissions are unchanged.

October 13 calendar name picker: replace event-editor employee checkboxes with Select or add person, partial-name suggestions, selected chips and Primary person. Adding remembers the name immediately even if the event is later cancelled, with an automatically assigned editable color. No account invitation/access is granted. Existing names/settings remain manageable; the main calendar legend is limited to people in displayed occurrences. Employee category colors remain unchanged.

October 14 Calendar Settings: Edit Person now includes Delete Person with in-app impact confirmation across both calendars, alongside the retained Active/Inactive field. Sole-person events are deleted; shared events keep remaining participants. Counts refer to saved events/series, not the infinite set of recurring occurrences. Cancel/Escape returns to Edit Person; confirmed deletion refreshes both calendars and discards removed-name filter selections. This action has no Trash/restore; audit/login accounts are preserved.
