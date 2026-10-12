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
