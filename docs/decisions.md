# Decisions and unresolved details

## Agreed decisions — October 5, 2026

| Decision | Reason / effect |
| --- | --- |
| Plan workflows, permissions, screens and styling before application code | Build a coherent system and review mockups first |
| Next.js App Router, TypeScript, Tailwind, shadcn/ui, Vercel | Confirmed framework/UI/hosting direction |
| Clerk, invitation-only email/password, no social sign-in, MFA later | Reduce authentication maintenance; keep password recovery |
| User and Admin; all approved users manage orders across divisions | Match company-wide collaboration |
| Creator/admin-only email send and order deletion | Keep these actions controlled without limiting ordinary edits |
| Assigned-user/admin file upload/deletion; all-user file viewing | Explicit attachment permission exception |
| Complete/Voided are filtered views of the same records | Keep identity, attachments and audit through status changes |
| Only Name required; autosave and conflict protection | Allow interrupted entry without losing work |
| Immutable creator separate from editable Date Entered | Preserve responsibility while supporting backdated reports |
| Three default item rows with more available | Retain familiar starting form and allow larger orders |
| Bell notifications for changes/assignments; only button sends SO email | Avoid automatic assignment emails and notification flooding |
| Fixed email field selection, blanks retained, no attachments | Managers see omitted entries; email deliberately differs from full form |
| 30-day admin Trash for orders; permanent individual file/comment deletion | Recovery for orders without adding individual restore features |
| Manual admin-maintained calendars visible to everyone | Scheduling visibility, not PTO approval or automatic order scheduling |
| Current-only price books, tab selection and in-app PDF viewing | Kent's latest review replaces the cards/new-tab proposal; Download remains separate |
| Admin reports use Date Entered, exclude Voided and Trash | Agreed reporting scope |
| Case-insensitive contains matching on free-text product/customer fields | Support existing entry habits without requiring a catalog |
| Dashboard cards plus active assigned orders; no calendar widgets | Keep landing screen focused |
| Responsive sidebar, light/dark, company logo, blue/orange-yellow accents | Agreed visual direction |

Neon PostgreSQL, Prisma, Resend, Cloudflare R2 and FullCalendar Standard remain proposed integrations pending version/terms/compatibility checks. Planning allowance remains approximately $100/month including contingency when Clerk's free tier suffices; this is not a price guarantee or purchase approval. Historical import/archive/fresh-start decision remains open.

## Required work before implementation

October 7 setup: Kent identified kent@cartsandparts.com as the initial administrator account. Provision this explicit account after verifying its Clerk identity; never promote the first arbitrary login. Recommended bootstrap is a one-time development provisioning command, with ordinary signed-in accounts denied data access until an active approved-user record exists. Prevent demoting/deactivating the last active admin when account administration is implemented. Bootstrap mechanics remain a recommendation pending implementation review.

October 7 database compatibility review: Prisma's current supported-databases documentation confirms Neon PostgreSQL support and describes Prisma 8 PostgreSQL as a release candidate. Stable Prisma 7 is recommended for this business application; Kent is being asked to select the major before installation. No ORM packages or database schema changes have been made. Source: https://www.prisma.io/docs/orm/supported-databases

Kent subsequently selected Prisma 7 stable. Prisma CLI/client/PostgreSQL adapter 7.10.0 are installed and the development connection passed a read-only query. The local schema is prepared but not migrated. This confirms Neon/Prisma choices; Resend, R2 and FullCalendar remain proposed.

Latest October 6 completion correction: Closed Out By and Closed Out Date are required for Complete and Voided, superseding Name-only closeout. Keep ordinary draft saving Name-only. Both bottom-positioned completion buttons move the record into Completed Sales Orders; the status-box path must enforce the same validation. Remove the legacy Voided checkbox from the new workflow. Automatic Completed By/Completion Date and Voided By/Voided Date still record the actor/event independently of these closeout inputs.

October 6 clarification: Monday Item ID is not a company-facing field. Omit it from the order form; retain the application's independent stable internal ID. An external Monday item reference is conditional on a later approved migration/integration. Assigned To must be unique per employee/order, remove selected employees from the available dropdown, and return removed active employees to it. Enforce this on the server as well as in the UI.

October 6, 2026: Kent likes the initial wireframe and confirmed initial Terms, Freight-Shipping and Job Type choices recorded in requirements.md. Admins can add/remove available choices, using the already agreed deactivation rule to preserve old values/history. These option lists supersede sample wireframe choices and source choices for new selections. They do not select a default value automatically. No Service/Maint/Service option appears in the supplied Job Type list, so the automatic Service and Labor expansion trigger needs clarification; manual expansion remains available.

Reference-based inventory: `field-inventory.md` covers the supplied screenshots/email. `monday-field-verification.md` records every column returned for the five relevant boards through read-only metadata access, including dropdown values and formulas. Focus review on field types and controls, not inferred meanings. Kent's latest clarification: AM Description is manual text in the labor inputs; its abbreviation is unknown and the earlier time interpretation is superseded. Labor Price and Travel Price are manually entered. Hours Worked automatically calculates from Time In/Out. Freight-Shipping and Freight are separate columns; calculations must not be inferred.

Kent approved all six supplied recommendations on October 5, 2026: terminal-status transitions clear the opposite current metadata and preserve both historical events; restoration retains prior status/assignments and flags inactive assignees; Date Entered/report boundaries use America/Chicago; optional blank amounts remain blank but contribute zero to totals; decimal charges are rounded to cents before summing. These are confirmed requirements in requirements.md and field-inventory.md, not pending proposals.

- Review the complete returned Monday column inventory and map newly discovered service/part/time/closeout fields, duplicate Miles/WO Additional Info, distinct Freight fields, and legacy dropdown values. Confirm Maint/Service behavior for automatic expansion. Do not drop source fields or silently reinterpret them; fixed email selection remains unchanged.
- Preserve manual Labor Price and Travel Price; do not add rate-based calculation. Resolve remaining total inputs when implementing pricing, without inventing NTE enforcement, tax/discount behavior or AM calculations. Optional blank handling and charge-before-total rounding are agreed; decimal tie-breaking mode remains undefined. Hours Worked edge cases remain to be defined.
- Review wireframes for screens in screens.md and styled light/dark mockups.
- Define audit-display time zone. America/Chicago is confirmed for Date Entered defaults/report date boundaries; calendar timed events use event-location time zone.
- Define restored-file availability, notification behavior, and inactive-assignee flag presentation for orders restored from Trash. Previous status/assignments are retained.
- Resolve whether extra item rows may be removed and whether default blank three rows must always remain.
- Confirm other copied job-specific fields/notes beyond the explicitly agreed reset list.
- Define first-admin provisioning and protect against accidentally removing the last administrator.
- Define upload types/sizes/storage limits, preview behavior and cleanup retry handling.
- Define precise notification grouping interval, persistence/read retention, deletion/restoration notifications and treatment of comment edits/deletions.
- Confirm recurrence patterns, exceptions and daylight-saving behavior; optional person/location calendar filters remain undecided.
- Specify report columns, totals/blank-data presentation, sorting and download layouts.
- Confirm sender/reply-to/domain for email and failure/retry handling; no provider purchases authorized.
- Define search punctuation/spacing treatment and assignment-column sorting where multiple users exist.
- Define list pagination and direct-link behavior for order panels.
- Decide company ownership/administrator access for repository and service accounts; verify current repository visibility before putting company data in it.

## Before pilot/live launch

- Pick higher production SO starting number with headroom above Monday; use independent test numbering.
- Decide official system of record during concurrent pilot and Monday operation.
- Decide historical migration and retention/export strategy; preserve actual files and associations if required.
- Confirm deployment environments, backups/restore procedures and audit retention beyond order Trash.
- Complete permission, workflow, concurrency, email, reporting and restoration verification.
- Obtain explicit live-launch authorization.

These unresolved details are not reasons to revisit already confirmed requirements. Record later decisions here and update requirements/screens consistently.
