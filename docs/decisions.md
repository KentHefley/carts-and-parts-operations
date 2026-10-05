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
| Current-only price books, PDFs open in new tab | Simple distribution and replacement |
| Admin reports use Date Entered, exclude Voided and Trash | Agreed reporting scope |
| Case-insensitive contains matching on free-text product/customer fields | Support existing entry habits without requiring a catalog |
| Dashboard cards plus active assigned orders; no calendar widgets | Keep landing screen focused |
| Responsive sidebar, light/dark, company logo, blue/orange-yellow accents | Agreed visual direction |

Neon PostgreSQL, Prisma, Resend, Cloudflare R2 and FullCalendar Standard remain proposed integrations pending version/terms/compatibility checks. Planning allowance remains approximately $100/month including contingency when Clerk's free tier suffices; this is not a price guarantee or purchase approval. Historical import/archive/fresh-start decision remains open.

## Required work before implementation

- Inventory every Monday order field and dropdown value; map retained labels, types, related records and email inclusion. Do not claim current screenshots/PDF contain every field.
- Confirm exact monetary meanings/rates for labor, travel and other charges, rounding, blank vs zero, freight, AM fields and any tax/discount handling. Formula is agreed; these definitions are not.
- Review wireframes for screens in screens.md and styled light/dark mockups.
- Define status metadata when moving directly Complete to Voided or vice versa. Active-return reset behavior is agreed.
- Select company business time zone for Date Entered default/report date boundaries and audit display. Calendar timed events use event-location time zone.
- Decide restoration status, assignment handling, restored-file availability and notification behavior for orders restored from Trash.
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
