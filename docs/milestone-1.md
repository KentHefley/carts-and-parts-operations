# Milestone 1: authenticated order persistence

## Review status

Kent approved the current design direction on October 7, 2026, acknowledging that later changes are expected. Preserve the reviewed requirements and configurable-field extension. Approval does not imply that the mockups are production code or authorize live launch, purchases, migration, commits or pushes.

## Scope

Invitation-only sign-in, password recovery, approved-user access checks, order list, new-order allocation, save/edit/reopen and repeatable item persistence. Use the approved shell and initial choices. PostgreSQL stores authoritative records; Clerk supplies authentication. Neon and Prisma remain proposed pending approval and compatibility/commercial-term checks. No browser storage or local JSON as the source of truth.

Keep the full mapped field inventory available for the eventual form and schema. Deliver this milestone incrementally; do not infer unresolved calculations or implement unreviewed freight/NTE behavior. Later milestones implement email, notifications, files, status closeout, copies, calendars, reports, Trash and admin field configuration. Do not expose unfinished actions as working features.

## Acceptance criteria

- Unauthenticated, unapproved and inactive accounts cannot read or write orders, including direct server requests. No public self-registration or social sign-in.
- Approved users can create, save, edit and reopen an order. Name is the only ordinary-save requirement; whitespace is rejected.
- Clicking New Order reserves a unique company-wide test SO Number immediately. Retries do not duplicate creation; abandoned numbers are not reused. Concurrent allocations are unique. Live numbering remains separate and undecided.
- New orders start In Progress, Division blank, three item rows; additional rows persist in order.
- Editable Date Entered uses America/Chicago defaults. Original creator and creation timestamp are immutable and server assigned.
- Save feedback distinguishes saving, saved and failure. Failed requests retain entered values. Refresh/reopen restores saved records and item rows.
- Same-field conflicts cannot silently overwrite another user's changes. Different-field updates remain independent. Related writes are transactional.
- Inputs and access are validated server-side. Credentials remain server-only; .env.example contains placeholders only.

## Verification

Use at least two approved test accounts plus unauthorized/inactive cases. Exercise concurrent New Order clicks, request retries, blank Name, optional blanks, extra item rows, failed save, refresh, reopen, and conflicting versus independent edits. Run repository lint and production build; add targeted integrity/permission tests and browser workflow checks as code exists. No checks have been run for this milestone yet.

## Setup needed

Confirm the proposed Neon PostgreSQL and Prisma choices after compatibility/terms review. Provision company-owned Clerk development application and non-live database credentials. Configure invite-only email/password authentication without exposing secrets in chat. Identify the initial admin email and a separate approved test-user email. Decide first-admin provisioning/last-admin protection before user administration is enabled. Keep pilot/live credentials and data isolated; use fictional orders for this milestone.

## Repository inspection

October 7 package.json declares Next.js 16.3.8, React/React DOM 19.2.8, Tailwind 4 and TypeScript 5. Scripts: dev, build, start, lint. Clerk, Prisma and database integrations are not declared. Confirm installed versions and read version-matched Next.js documentation before application changes. The existing app is a starter, not the interactive planning mockups. Local Git status was clean at the start of this preparation.
