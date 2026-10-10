# Screen and styling plan

Agreed direction, October 5, 2026. This is a browser-based responsive web app. Screens described here are planned, not implemented. Review wireframes and styled mockups before application development.

## App shell and navigation

Carts and Parts logo; collapsible left sidebar on large screens, icon tooltips when collapsed, remembered user preference. On phones use a collapsible navigation menu. Top bar contains page title, notification bell, light/dark toggle and user menu. Remember theme preference.

The bell is red when unread notifications exist and displays an unread count. With no unread notifications, show a neutral bell. Provide an accessible unread-count label and Mark all as read action; opening the panel alone does not clear unread notifications.

Navigation: Dashboard, Sales Orders, Completed Sales Orders, Price Books, Calendar, Time Off/Birthday Calendar. Admins also see Reports and Administration; Trash is inside Administration. Enforce permissions on the server, not solely navigation.

Use neutral readable backgrounds with blue primary accents and orange-yellow selected buttons/highlights. Distinguish destructive actions. Exact colors, logo asset, typography and component treatment await mockup review. Support both light/dark contrast, keyboard access, readable tables and form labels.

## Dashboard

Landing screen after sign-in. Navigation cards for the five primary sections; admin cards for Reports and Administration. Orders Assigned to You lists only assigned Pending/In Progress/Expedite orders. Opening one opens its form. No calendar updates or schedule widgets.

## Order lists

Sales Orders contains active statuses; Completed Sales Orders contains Complete/Voided.
Columns: SO Number, Name, Status, Division, Job Type, Scheduled Job Date, Assigned To.
Every result row displays its order values in all seven columns. Show an em dash for blank optional values; do not leave ambiguous empty cells. SO Number is visibly displayed and can open the order.
Search by Name appears at the top of the fields and matches Name only. A separate SO Number search precedes Status. Store Number and Purchase Order search are omitted, per Kent's October 7 correction.
Filters: Status, Division, Job Type, Assigned To, Scheduled Job Date.
Kent's October 7 review: Search by Name is the top field; put the dedicated SO Number search before the Status filter below it. Apply this order to both active and completed order lists.
Sortable column headings toggle ascending/descending. Active default: newest Date Entered first. Completed default: latest completion/void event first. Preserve query, filters, sort and position when closing form.

Compact table; no inline field editing. Click order to open wide slide-out form on larger screens; full-screen form on mobile. Direct order navigation/link behavior remains to be specified.

## Order form

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

Use Add Sales Order Field as the navigation button label for field configuration, per Kent's review. This screen also provides admin-only editing of existing field definitions.

- User invitations, deactivation and User/Admin roles.
- Employee directory including employees without accounts.
- Dropdown choices (Division, Job Type, Terms, Price Level and other mapped choices): add/change/deactivate, preserve existing values.
- Calendar categories: add/rename/deactivate.
- Trash: deletion time, expiry, restore within 30 days, minimal retained audit after purge.
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
