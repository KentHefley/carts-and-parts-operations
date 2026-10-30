# Development maintenance setup

October 29 follow-up: after local review, Kent explicitly authorized pilot board deployment. Both sorting indexes are now applied to Pilot and deployment `dpl_Erjauvd89H84kTdBaq8soicXbbRD` is promoted/Ready at the normal pilot URL. See `pilot-order-board-release-2026-10-29.md`; this supersedes the local-only status below. Development sample data remains separate. No initial live launch or Git integration was performed.

October 29 order-board paging is local only. Migration `20261029010000_order_board_paging` adds two partial expression indexes for open/completed JSON date sorting; it changes no fields or saved values. Applied to verified Development. On a later authorized pilot release, verify the Pilot target and deploy migrations before promoting the tested deployment. Do not infer authorization to migrate or deploy from this note. Dashboard's existing assigned-order query is outside this milestone.

October 15 custom-field migrations: `20261015030000_order_field_layout` adds versioned layout/configuration audit; `20261015040000_custom_field_amounts` adds related exact decimal currency values with order-delete cascade. Both applied only through the guarded development migration script. Expired order purge explicitly removes decimal values while retaining its minimal order tombstone. No live migrations or deployment performed.

No live launch or deployment is authorized by this document. Storage fails closed unless it matches the explicitly selected, enrolled development or pilot services and Clerk test configuration. See pilot-setup.md for the current hosted pilot preparation; the pilot Vercel project's production target is distinct from future live operation.

## Trash cleanup

Development backup/restore procedure and October 16 verified drill are in [backup-restoration.md](backup-restoration.md). Local encrypted archives and their separate key are ignored under .recovery/. Independent company-controlled archive/key storage and automated scheduling are still required; local recovery verification is not a configured production backup service.

Orders enter Trash for 30 elapsed days. Restoration stops at expiration. Physical removal occurs on the next successful cleanup; storage outages can delay removal. Admins can run Administration → Trash → Clean Expired Trash. Localhost has no automatic scheduler. The guarded local command is `npm run cleanup:trash:development`; it checks the exact development target before making changes.

Source includes `/api/maintenance/trash` and a daily 09:00 UTC schedule in vercel.json. Before an authorized hosted deployment, add a server-only, randomly generated CRON_SECRET of at least 32 characters to the intended Vercel environment, and verify the database/bucket/Clerk targets. The route refuses missing/incorrect secrets and live targets. Preview deployments must never receive live credentials. Hosted scheduling is not verified or activated by local testing.

Vercel cron calls use a Bearer CRON_SECRET header and run against the project's production deployment rather than localhost or ordinary previews. Verify the deployed job, access protection, logs and plan limits before pilot use. References checked October 11, 2026: [Cron quickstart](https://vercel.com/docs/cron-jobs/quickstart), [securing and managing cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Each call attempts up to ten expired orders, prioritizing least recently attempted records. It stops starting work after a short time budget. Successful staging/final object deletions are recorded per file, so later calls resume progress. A failed/incomplete batch returns HTTP 503; monitor failures and retry via the admin control. Do not assume the scheduler retries immediately. Large backlogs need repeated invocations and monitoring before pilot.

Retained tombstones hold only identity/number, creator reference, request key for deduplication, lifecycle timestamps and deletion actor. They prevent reuse/resurrection of previously reserved numbers. Minimal audit retention remains undecided.

## Attachment staging

Individual-file cleanup remains an admin retry action. Before unattended pilot operation, configure a staging-prefix lifecycle backstop and scheduled pending-upload cleanup. Preserve final `development/orders/` objects until their explicit deletion or whole-order purge; never apply staging expiration to the whole bucket. Confirm Public Development URL remains disabled and no Custom Domain is connected.

Price Books: deploy migration 20261012180000_price_books only to the verified target. PDF.js requires Node 22.13+ or 24+; local verification used 24.16.0. prebuild copies licensed PDF renderer/worker/font/WASM assets from the pinned dependency into ignored public/pdfjs. Keep R2 private and add the authorized deployment origin to upload CORS. Price Book staging/replaced cleanup currently runs after publication or through an admin retry; schedule cleanup before live operation. No live deployment has been performed. Review the Prisma/ESLint dependency advisories recorded in price-books-milestone.md before release.

Calendar migrations 20261013010000 and 20261013011000 are applied to development only. Future authorized deployments require these additive migrations and a regenerated Prisma client in the target non-live/live environment as appropriate. Calendar data is stored in PostgreSQL; no external scheduler is required for recurrence expansion. Do not copy development events into production automatically.

## Production build bundler — October 15
Installed Next.js 16.3.8 supports next build --webpack (verified in bundled CLI documentation). The build script explicitly uses Webpack because the local Turbopack build repeatedly exits while starting the PostCSS/CSS worker before application compilation. This is a workaround for the observed worker failure, not a confirmed diagnosis of its underlying cause. Development continues using next dev. No dependencies or deployment targets changed. Revisit Turbopack in a separate tested upgrade.

October 15 follow-up: warm Webpack production builds repeatedly failed inside WasmHash; a fresh cache passed. next.config.ts now disables the production Webpack cache through the supported webpack configuration hook. Development caching remains unchanged. Builds take a full compilation each time; no dependencies upgraded. Additive migration 20261015010000_order_dropdown_choices seeds the agreed 25 choices and adds choice/audit tables. Applied to guarded development only; future authorized deployments must apply migrations and regenerate Prisma.

Comments migration 20261015020000_order_comments is applied to guarded development only. Future authorized targets require additive migrations and Prisma regeneration. Comments are private application records; no external email/storage service is used. Whole-order purge removes comments and detailed order audit at the existing retention boundary.

## October 17 — first authorized pilot deployment

Kent explicitly authorized the first pilot deployment. Vercel company project carts-and-parts-operations-pilot is Ready: deployment dpl_5QA8XzukeMW7NrkwfkMsR5SUc8Yn, stable URL https://carts-and-parts-operations-pilot.vercel.app . Source is pushed commit da2960be81fe714cc7cfd9b90bf8194a156b649d plus the locally prepared .vercelignore and verification notes. No Git auto-deployment connection configured. Remote Node24 install, Prisma7 generation and Next16.3.8 production build succeeded. No development orders/books/events copied. Future live launch remains unauthorized.

Hosted verification passed: root, sales-orders and reports/export redirect signed-out visitors to app sign-in; sign-in returns200 and renders Pilot plus the correct separate Clerk application with no browser errors. No extra Vercel login is required at the stable employee URL; deployment protection was not changed. Maintenance without secret returns401. Authorized maintenance returns200 with zero checked/purged records, verifying deployed database/storage guards. Vercel reports cleanup schedule 09:00UTC enabled; first scheduled invocation remains unobserved. Pilot backup GitHub daily schedule is active and manual hosted run39053304417 passed.

Kent should now sign in with kent@cartsandparts.com and verify the Pilot notice, Dashboard and administrator sections, followed by hosted order/save/reopen/file/email/report/calendar checks. Authenticated hosted flows have not yet been verified. Pilot starts without orders, books or events; admins can upload books in the pilot UI. Daryl/Jake invitations remain unsent until Kent manually sends them Monday. No SO email sent during deployment. .vercelignore and these deployment notes still need a later commit/push.

## October 28 — team-requested pilot update

Kent authorized deployment after pushing 68c49375a37b11471bb4fe6d287a4fbed59b65b8. Staged dpl_A39coWWxWtstntCrU3xknp9ZxkoY passed remote build, pilot read-only database queries and protected HTTP checks, then was promoted to the stable pilot address and reverified Ready. Guarded freight settings update applied with audited readback. No schema migration, development data copy, real emails or invitations. Rollback reference and exact scope are in pilot-release-2026-10-28.md. Authenticated hosted employee review remains pending.
October 28 status-cursor follow-up deployed with authorization: Ready dpl_7RTreapmcBwBU96f6n85ufY1tpZx promoted and verified at stable pilot. Remote build/types and published CSS pointer-rule checks passed. No database changes. Immediate rollback dpl_A39coWWxWtstntCrU3xknp9ZxkoY.

October 29 Freight placement update authorized and deployed: Ready dpl_FRYp6CKvuUM8dqoQUoxLHJu7yyQQ verified at stable pilot. Pilot saved layout already matched requested placement, so no settings write was needed. Default definition now matches. Build/types, hosted identity and layout readback passed; rollback dpl_7RTreapmcBwBU96f6n85ufY1tpZx. See pilot-freight-placement-2026-10-29.md.
