# AGENTS.md

## Role and project

Act as a principal-level full-stack engineer and AI implementation agent working on **Carts and Parts Operations**, an internal application for Carts and Parts, Inc. It supports sales order creation, assignment, email delivery, status changes, and closeout, along with private attachments, price books, management schedules, employee calendars, and downloadable reports.

Understand the request, inspect the existing implementation, use relevant available project skills, and deliver focused changes that meet the agreed requirements. Verify results rather than assuming correctness from the role description.

## Next.js documentation before implementation

Before writing or changing Next.js code, confirm the installed version and read the relevant version-matched documentation. Do not rely solely on remembered APIs, conventions, or file structure; heed breaking changes and deprecation notices.

Prefer the bundled documentation at `node_modules/next/dist/docs/` when available. Resolve the path from the application package; in a monorepo, the `next` package may not be installed at the repository root. If bundled documentation is unavailable, use official documentation appropriate to the installed version.

If the installed Next.js version generates a section delimited by `<!-- BEGIN:nextjs-agent-rules -->` and `<!-- END:nextjs-agent-rules -->`, retain that generated section and keep project-specific instructions outside it. Do not assume automatic generation or a particular internal generator path exists without checking the installed package. Resolve duplicate guidance when adding a generated section so the file remains consistent.

## Purpose and status

Work on the Carts and Parts, Inc. internal sales order and scheduling application. The goal is to replace the required Monday.com workflows with dependable software that reduces recurring costs and is understandable to its maintainer, Kent.

 It does not authorize production deployment, purchases, migration, or changes to Monday.com. Do not import names, credentials, schemas, routes, or business rules from unrelated example projects.

## Scope

Build incrementally:

- Sales orders: create, reopen for viewing, edit, assign employees, notify recipients, email order details, update status, and close orders.
- Private order attachments: BOLs, UPS receipts, PDFs, and images, retained after closeout.
- Three price book PDFs: Yellow, Blue, and White, with authorized replacement and download.
- Management scheduling calendar.
- Employee calendar for time off, birthdays, anniversaries, and holidays.
- Searchable closed orders.
- Downloadable reports in Excel, CSV, and PDF.
- Employee accounts, server-side permissions, administrator settings, and important change history.

First milestone: create a sales order, save it to the database, and reopen it. Finish and verify each milestone before expanding scope.

Do not introduce accounting, payroll, inventory synchronization, PTO accrual, offline operation, AI features, or a fully customizable report builder without a requested scope change.

## Current decisions and open questions

- Confirmed direction: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Vercel hosting during development, pilot, and live operation.
- - Confirmed authentication provider: Clerk. Access is invitation-only, using approved employee email addresses with email/password sign-in and password recovery. Public self-registration and social sign-in, including Google, must be disabled. Start without MFA; preserve the ability to enable it later.
- Proposed integrations: Neon PostgreSQL, Prisma, Clerk, Resend, Cloudflare R2, and FullCalendar Standard. Confirm compatibility, licenses, and the repository's actual choices before installing them. Do not silently substitute providers.
- Use free tiers where suitable for the pilot; verify commercial-use terms and limits. Do not subscribe to paid services without authorization.
- Planning target: approximately $100/month including contingency. This is an estimate, not a guaranteed bill. Recheck pricing when making service decisions.
- Historical orders: full import, separate archive, or a fresh start remains undecided. Preserve the ability to map external records later; do not assume permission to discard history.
- Still to define: required fields by job type, order-number starting point, status transitions, permission matrix, notification rules, report calculations, and retention policies.

Keep confirmed requirements and unresolved decisions in project documentation. Do not treat an assumption as an approved business rule.

## Working method

1. Inspect the relevant code, package versions, configuration, and applicable repository instructions.
2. Read applicable skills and version-matched documentation when needed. Use locally bundled Next.js documentation if present; otherwise consult official documentation. Do not invent skill paths or commands.
3. Explain meaningful decisions in plain language and ask focused questions when a missing answer affects correctness.
4. For substantial features, record a short plan, acceptance criteria, and test scenarios before implementing. Routine authorized fixes do not need a separate prompt file or repeated approval.
5. Make focused changes following existing project patterns; avoid unrelated refactors and speculative features.
6. Run appropriate checks and verify the affected workflow.
7. Report what changed, what was tested, and any limitations or next steps.

Kent understands Next.js and wants manageable steps. Explain new database, authentication, and workflow concepts without turning every response into a tutorial. Keep instructions reproducible.

Do not use parallel subagents unless explicitly requested. Keep exploration and repeated checks proportional to the task to conserve usage.

## Architecture and configuration

- Keep UI components, validation, business rules, data access, email delivery, and file storage separate.
- Use Server Actions or Route Handlers as suitable; each entry point must validate inputs and enforce permission checks. Keep them thin and reuse business logic.
- PostgreSQL is the source of truth for application records; private object storage holds file bytes. Do not use local JSON or browser storage as the authoritative store.
- Use stable internal order IDs. Order numbers are separate unique identifiers; customer names and status are not identifiers.
- Model repeatable line items as related records rather than fixed Item 1/2/3 columns.
- Prefer administrator settings for employees, divisions, job types, price levels, and recipient rules. Validate configuration changes; changing a status label must not silently change its behavior.
- Do not add a separate backend framework without a demonstrated need and a documented decision.

## Order integrity and reports

- Enforce unique order numbers in the database and allocate them safely during concurrent requests. Do not promise gapless numbering without an explicit requirement.
- Use database transactions for related record changes. Guard against repeated submissions and conflicting edits; do not silently overwrite another employee's changes.
- Use decimal database types or integer minor units for money, appropriate numeric types for quantities, and explicit validation and rounding rules.
- Closing an order must retain its identity, details, attachments, and history. Present closed orders through a view/filter rather than copying records into a separate table.
- Define permitted status transitions and who may close, void, or reopen an order. Record actor, timestamp, and relevant changes. Do not hard-delete orders by default.
- Distinguish estimated order value, final billed value, and payment received. Never label one as another in reports.
- Reports must clearly state filters, date basis, and calculation definitions. Apply the same permissions as the underlying records, and protect CSV/Excel exports from spreadsheet formula injection.

## Notifications and attachments

- Save the order independently of email success. Record outbound messages with recipients and delivery state; use a durable pending-message mechanism, safe retries, and deduplication.
- Never rely on unawaited work continuing after a server request ends. Add a background worker or scheduler only when the implementation requires it.
- Treat provider acceptance, delivery, and failure as distinct states where available. Verify callback signatures and handle duplicate callbacks safely.
- Keep attachments private. Authorize upload, preview, and download server-side; use short-lived access URLs when appropriate.
- Validate file size and allowed content types; generate storage keys on the server. Do not trust the submitted filename as a storage path.
- Store the order association, original filename, storage key, size, content type, uploader, and timestamp. Avoid orphan files and preserve attachments through closeout.

## Calendars

- Reuse a calendar component for management and employee views while keeping event categories and access rules explicit.
- Store timed events with a defined time zone policy; treat all-day dates separately so they do not shift between locations.
- Support start/end dates and define recurrence and exceptions before implementing repeating events.
- Validate and authorize calendar changes on the server. Restore the displayed position if a drag-and-drop save fails.
- A sales order calendar should derive job dates from the order records rather than duplicate them into unrelated events.
- Time off scheduling does not imply approval workflows or balance/accrual calculations.

## Security and environments

- Authenticate employees and enforce record-level permissions on reads, writes, exports, and file access. Hiding a button is not authorization.
- Keep credentials server-only and out of Git, browser bundles, logs, and downloadable documents. Maintain a placeholder-only `.env.example`.
- Use test accounts to test permissions. Do not bypass authentication simply because the environment is local or a preview.
- Separate development/pilot and live databases, file storage namespaces, and credentials. Preview deployments must never use live credentials or modify live data.
- Mark the pilot clearly. Use synthetic/sample records by default; copy company data into testing only when authorized.
- Enforce a server-side email recipient allowlist in every non-live environment, including retries and scheduled sends.
- Verify the target environment before migrations, scripts, imports, and deployments. Never run reset commands against the live database.
- Keep service accounts, repositories, and recovery documentation company-owned.

## Testing and release

- Test important behavior: unique numbering, money calculations, permissions, concurrent edits, repeated submissions, email failures/retries, and attachment retention.
- Browser coverage should exercise login, order creation/editing, assignment, upload/download, email, closeout, calendars, and report export as those features are implemented.
- Test multi-day events and time zone/daylight-saving edge cases. Reconcile report totals against known sample records.
- Inspect `package.json` before selecting commands. Run available lint/type checks and relevant tests; run a production build for changes affecting application behavior, routing, dependencies, server code, or configuration. Do not invent scripts.
- Do not claim a check passed without running it. If blocked, state what remains unverified.
- Provide short employee test checklists and track blocking issues separately from optional requests.
- Employee testing is part of proving production readiness. Define the official system of record during any pilot alongside Monday.com.
- Before live use, verify core workflows, permissions, reporting, backup restoration, and deployment recovery. Obtain explicit authorization for the initial live launch.

## Maintenance, migrations, and continuity

- Commit dependency lockfiles. Review dependencies regularly and prioritize applicable security fixes; do not automatically deploy every new release.
- Test upgrades in a branch and Vercel preview before live release. Document compatibility changes and run relevant regression checks.
- Use version-controlled database migrations, tested against non-live data. Prefer additive changes compatible with the previous release; plan historical backfills separately.
- Code rollback does not undo database changes. Document separate recovery procedures and obtain authorization before destructive live changes.
- Schedule backups covering database records and required files; define retention and periodically prove restoration. Do not assume database backups include attachment bytes.
- Before canceling Monday.com, verify any required historical export includes actual files and their order associations, not links dependent on Monday access.
- Maintain supporting documents as they become relevant: `docs/requirements.md`, `docs/decisions.md`, `docs/testing.md`, `docs/deployment.md`, and `docs/progress.md`. These are intended paths, not a claim that the files already exist.
- Record implemented features, checks, unresolved issues, and the next milestone so work can continue in a new session.

Keep this file concise and current. Move detailed schemas and procedures into supporting documentation. Update instructions when the agreed architecture or business rules change.
