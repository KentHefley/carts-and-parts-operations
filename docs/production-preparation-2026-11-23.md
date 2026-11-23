# Production preparation - November 23, 2026

Kent has upgraded Neon, Clerk and Resend and requested production preparation for a demonstration on Monday, November 30. Initial live launch requires explicit authorization after review.

## Current review

- Working tree was clean at the start of preparation.
- Runtime environment policy currently supports Development and Pilot only. Production requires an explicitly enrolled database, private R2 bucket, Clerk live instance, application origin and Vercel project.
- Existing Clerk page-load recovery follow-up is recorded in pilot-auth-incident-2026-11-02.md. Inspect installed SDK retry behavior before implementing bounded read-only retry and application recovery UI.
- Dependency review from November 2 needs a current audit and compatible remediation assessment before release.
- Current settings must be reconciled with the chosen starting data, including Job Type additions/order, Freight/Miles placement and retired descriptions.

## Work sequence

1. Confirm production hostname, initial order number and starting records/settings.
2. Audit current dependencies and implement/test the pending identity recovery behavior.
3. Enroll separate production services and add guarded production configuration, migration and initial administrator provisioning. Configure Clerk invitation-only access, required names and password recovery on its live instance.
4. Configure production email, private-file CORS, scheduled cleanup and encrypted daily backups with the approved 30-day retention. Verify a production-target recovery procedure.
5. Build a staged release and verify sign-in, roles, create/save/reopen, concurrent edits, assignment/comment bells, uploads/downloads, email, closeout, calendars and report exports.
6. Review the demonstrated release with Kent and obtain authorization for initial live launch. Connect the company Vercel project to GitHub with environment-specific preview settings as part of the agreed release setup.

## Acceptance criteria

- Production data and credentials are isolated from Development, Pilot and ordinary previews.
- Production configuration and starting records match Kent's decisions.
- Core workflows, current permissions, email delivery, file access, cleanup, backup restoration and release recovery have recorded verification results.
- November 30 demonstration has an agreed URL and prepared accounts/data.

## Confirmed starting configuration

- Hostname is operations.cartsandparts.com.
- Sales orders and calendars start empty in the separate production database. Preserve the Pilot for continued access.
- Carry over current settings and the three price books. Copy original private PDF bytes and their metadata into production storage.
- First production SO number is 25000. Set the fresh sequence before any order creation and verify without consuming the first production number.
- Replace development-prefixed number formatting consistently across boards/search, dashboard, order tabs, notifications, activity and reports for production.

## Service enrollment

Production Neon connection verified read-only on November 23. Host `ep-flat-boat-behrz8oq-pooler.c-9.us-east-2.aws.neon.tech`, database `neondb`, distinct from Development/Pilot. Public schema contains zero tables. Private credentials are in ignored `.env.production.local`. Schema creation and initial sequence setup remain pending.

Subsequent setup completed schema migrations through guarded migrate-production.ts. Verified zero orders, sequence value 25000 with is_called=false. The sequence was inspected without allocating a number. Clerk live keys were validated for clerk.cartsandparts.com. Production R2 listing authenticated successfully and returned an empty bucket; Kent configured upload CORS and confirmed no custom domain. Production Resend key is separate from testing. Public bucket access and actual production upload/delete/email delivery still need verification.

Created company Vercel project carts-and-parts-operations, ID prj_bIdQIZ4SSKkgAQOxHQzqZHjA848W. Configured Next.js, Node 24, npm ci and npm run build. Production-only variables were stored through configure-production-vercel.ts. The workspace remains linked to Pilot, so all production setup uses an explicit project ID. Added operations.cartsandparts.com and obtained its required DNS record: CNAME operations to 2d55395ccb54255a.vercel-dns-016.com. DNS completion and Kent's Clerk production signup are pending replies.

Source preparation is on codex/production-preparation-2026-11-23. Production runtime guards enroll the exact database, bucket, Clerk domain, application origin and Vercel project; a Vercel Preview using production configuration is rejected. Shared display formatting gives production plain SO numbers and preserves current test numbering. Production invitations and SO sends use live configuration with existing actor and assignee checks. Protected Super Admin bootstrap is prepared and awaits Kent's verified production identity.

Dependency audit initially reported three high and eight moderate findings. Next 16.4.3 build compiled but stopped with its security advisory warning. Updated Next/eslint-config-next to 16.4.6 and scoped @prisma/config's Effect dependency to patched 3.22.1. Compatible npm audit fix updated remaining transitive dependencies; npm reported zero vulnerabilities. Primary advisory references are https://github.com/advisories/GHSA-7589-6fvf-x4pw and https://github.com/advisories/GHSA-f3mh-rxg3-f5g2. All 65 unit tests and guarded Development board/report regressions passed. Patched production build and final lint verification are pending completion.

Remaining preparation includes setting/book transfer, identity recovery follow-up, production backup/restore/cleanup checks, staged hosted verification, signed-in acceptance and initial launch authorization. No hosted production release, real email send, Git commit or push has been performed in this preparation step.

Final verification for this preparation step: Next 16.4.6 production compilation and TypeScript passed, along with scoped app/library/setup-script ESLint. The npm audit installation report has zero findings. Clerk signup and the operations DNS record are the next user actions. The Vercel connector returned 403; the existing company CLI connection completed the scoped setup successfully.

Kent subsequently confirmed operations CNAME entry and completed production signup. Public DNS and Vercel both verified the domain. bootstrap-production-admin.ts verified Kent's primary email/name and provisioned the first production AppUser as protected Admin. initialize-production-content.ts previewed and applied 28 choices, 83 field definitions, four calendar people and four categories from Pilot, recording a settings checksum/audit. Three current books were uploaded through the existing validated staging/publication workflow; each production PDF's SHA-256 and page count matched the source. Orders and calendar entries remain zero. Transfer verified production upload, copy and read permissions; staging cleanup/delete and actual email delivery still need verification. The saved source snapshot is ignored under tmp/production-content-source.json.

Final local build after content-script typing correction passed. All 65 unit tests and Development board/report regressions passed, Prisma schema validation passed, and source lint passed. A staged Vercel production-target build with --skip-domain is in progress. The local Pilot project link is restored by the deployment script after completion. Activation at the operations custom domain requires review and explicit authorization. Production backup scheduling/restoration, transient identity recovery and signed-in hosted workflow checks remain outstanding.

Staging completed as Ready dpl_72nstWUr2uf3MuXasm84VtU25GqL at https://carts-and-parts-operations-9jyamt7n1-carts-and-parts.vercel.app. Remote build passed with patched dependencies. Hosted sign-in returned 200 and the expected Operations/live Clerk configuration, CSS returned 200, signed-out board API returned 401 and protected Sales Orders redirected to sign-in. Verification used Vercel's protection bypass for HTTP checks, with the production project selected temporarily and the Pilot link restored afterward. No employee authentication bypass or real email send occurred. Staged deployment is not yet promoted to the operations custom domain.

## Recovery follow-up

Added a single bounded fresh identity lookup after Clerk 500/502/503/504 errors. Inspected installed Clerk currentUser/backend GET implementation and Next dedupe-fetch: explicit AbortSignal bypasses render-time GET memoization. The retry uses a no-store, 10-second signal-bound GET for the already-authenticated user ID, preserves current email verification, banned/locked flags and invitation metadata, and then runs the ordinary database approval checks. Authentication/rate-limit/unrelated errors propagate immediately. A root application error boundary provides Try again using Next 16.4.6's retry prop, without exposing raw error text. Nine identity/access tests passed, and a read-only real production identity lookup passed the approval check. Browser component check verified retry invokes once, private error text is hidden, and the compiled-styles layout fits 390px.

Extended backup targeting and retention to production. Initial encrypted archive production-177a15a07eca667085a79414.cnpbackup covered 25 tables and three PDFs (14,606,434 file bytes). Dropbox upload/download SHA-256 verification passed (14,277,095 encrypted bytes). Isolated database and R2 recovery-prefix restoration verified all tables/files, then cleaned its temporary resources successfully. There were zero order-attachment associations because production has zero orders. Existing recovery key was reused and kept separate from Dropbox.

Configured encrypted GitHub secrets in the production-backups environment with main-only branch restrictions. Prepared .github/workflows/production-backups.yml for daily 11:17 UTC backups and 30-day production-only retention. The workflow is local on the preparation branch and is not scheduled until published/merged to main. Six retention tests include cross-environment deletion isolation. Existing tooling has a 250MB total raw-file limit and 150MB encrypted Dropbox single-upload limit; the initial archive is below both. Increased-volume streaming/upload-session support is a follow-up before these limits are reached.

Final local production build, source lint, 71 TypeScript unit tests and six backup-retention tests passed. Updated staged release dpl_EJxs6diagV4Y6W7MGCgDG4UAh437 is Ready. Hosted checks passed for sign-in and stylesheet HTTP 200, correct production Clerk identity, signed-out board API HTTP 401 and protected orders-page redirect. The workspace Pilot project link was restored after verification. Initial custom-domain activation and signed-in hosted acceptance remain pending authorization/review. Publish and merge the preparation branch to main, then run and verify the hosted production backup workflow before activation.
