# Development maintenance setup

No live launch or deployment is authorized by this document. Storage currently fails closed unless it matches the verified development Neon database, Clerk test keys and carts-parts-operations-development R2 bucket.

## Trash cleanup

Orders enter Trash for 30 elapsed days. Restoration stops at expiration. Physical removal occurs on the next successful cleanup; storage outages can delay removal. Admins can run Administration → Trash → Clean Expired Trash. Localhost has no automatic scheduler. The guarded local command is `npm run cleanup:trash:development`; it checks the exact development target before making changes.

Source includes `/api/maintenance/trash` and a daily 09:00 UTC schedule in vercel.json. Before an authorized hosted deployment, add a server-only, randomly generated CRON_SECRET of at least 32 characters to the intended Vercel environment, and verify the database/bucket/Clerk targets. The route refuses missing/incorrect secrets and live targets. Preview deployments must never receive live credentials. Hosted scheduling is not verified or activated by local testing.

Vercel cron calls use a Bearer CRON_SECRET header and run against the project's production deployment rather than localhost or ordinary previews. Verify the deployed job, access protection, logs and plan limits before pilot use. References checked October 11, 2026: [Cron quickstart](https://vercel.com/docs/cron-jobs/quickstart), [securing and managing cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Each call attempts up to ten expired orders, prioritizing least recently attempted records. It stops starting work after a short time budget. Successful staging/final object deletions are recorded per file, so later calls resume progress. A failed/incomplete batch returns HTTP 503; monitor failures and retry via the admin control. Do not assume the scheduler retries immediately. Large backlogs need repeated invocations and monitoring before pilot.

Retained tombstones hold only identity/number, creator reference, request key for deduplication, lifecycle timestamps and deletion actor. They prevent reuse/resurrection of previously reserved numbers. Minimal audit retention remains undecided.

## Attachment staging

Individual-file cleanup remains an admin retry action. Before unattended pilot operation, configure a staging-prefix lifecycle backstop and scheduled pending-upload cleanup. Preserve final `development/orders/` objects until their explicit deletion or whole-order purge; never apply staging expiration to the whole bucket. Confirm Public Development URL remains disabled and no Custom Domain is connected.

Price Books: deploy migration 20261012180000_price_books only to the verified target. PDF.js requires Node 22.13+ or 24+; local verification used 24.16.0. prebuild copies licensed PDF renderer/worker/font/WASM assets from the pinned dependency into ignored public/pdfjs. Keep R2 private and add the authorized deployment origin to upload CORS. Price Book staging/replaced cleanup currently runs after publication or through an admin retry; schedule cleanup before live operation. No live deployment has been performed. Review the Prisma/ESLint dependency advisories recorded in price-books-milestone.md before release.

Calendar migrations 20261013010000 and 20261013011000 are applied to development only. Future authorized deployments require these additive migrations and a regenerated Prisma client in the target non-live/live environment as appropriate. Calendar data is stored in PostgreSQL; no external scheduler is required for recurrence expansion. Do not copy development events into production automatically.
