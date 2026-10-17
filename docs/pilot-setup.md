# Hosted pilot preparation

Kent will manually invite Daryl and Jake on Monday after speaking with them. Do not send their invitations during setup or deployment verification. Initial hosted testing can use Kent alone; multi-user pilot checks follow the invitations.

## October 17 hosted configuration

Next milestone plan: verify Kent's primary pilot email and required name before initial admin provisioning; refuse existing conflicting users/permissions. Extend the existing backup implementation with an explicit enrolled pilot target and archive namespace, preserving development defaults and old archive compatibility. Keep pilot/development retention isolated; require existing recovery key and exact target before restore drills. Verify policy rejection paths, encrypted capture/restore/file associations, Dropbox checksum and guarded GitHub backup environment. Daily pilot workflow activation requires Kent's commit/push; no Daryl/Jake invitations or deployment during this work.

Verified the company project and assigned, verified production domain `carts-and-parts-operations-pilot.vercel.app` through Vercel CLI/API. Saved APP_URL in ignored .env.pilot.local and generated a separate 32-byte random CRON_SECRET there. `scripts/configure-pilot-vercel.ts` validates the enrolled resources, exact linked company project and verified domain, then sends values to Vercel CLI through stdin without logging them or putting secrets in arguments. It never overwrites existing hosted variables or deploys. Configured seven Config variables and seven encrypted Secrets, only for this pilot project's production target; this Vercel target serves the stable pilot address and is not the future live environment. System environment variables are enabled, including the project ID required by runtime validation.

Pilot bucket CORS lookup with its scoped object token returned 403, so Kent was asked to save hosted-origin PUT/content-type CORS through Cloudflare and confirm public development URL/custom domains remain disabled. Confirmation and signed-upload browser preflight verification are pending. Existing Vercel deployment protection remains unchanged; verify employee access to the stable domain after the first authorized deployment. No invitations, SO emails, deployment or Git connection created. Kent's pilot Clerk signup/admin bootstrap and pilot backups remain pending.

## October 17 status

Separate pilot Clerk Development application created; Kent confirmed Invite-only access, required first/last names, email/password enabled, social sign-in disabled, user email changes/account deletion disabled. Keys differ from development; read-only Backend SDK instance queries verified valid Development instance and distinct instance IDs. These queries verify instance identity, not the individual Dashboard configuration settings; those remain Kent-confirmed until hosted authentication review.

Pilot migration target is explicitly enrolled as `ep-summer-frog-b5cbla8f-pooler.c-7.us-east-2.aws.neon.tech/neondb`. `scripts/pilot-target.ts` reads only .env.pilot.local and rejects wrong protocol/host/database, mixed development credentials, live Clerk keys and missing storage fields. Found a missing initial p in the saved postgresql URL; guard refused the first attempt before changes, then corrected only that prefix. `npx tsx scripts/migrate-pilot.ts` applied all 17 checked-in migrations to pilot only and verified 25 tables, zero users and zero orders. No development data copied. Two target-validation tests passed; TypeScript and focused lint passed.

Kent approved pilot testers kent@cartsandparts.com, daryl@cartsandparts.com and jake@cartsandparts.com for access and SO email. Saved both invitation and SO-recipient allowlists in .env.pilot.local. Application pilot guard/email integration is still pending; these variables alone do not enable current development-only email/storage paths. No invitations/emails sent. Next: separate pilot Resend sending key, explicit app pilot environment support, hosted URL/CORS/configuration, initial admin setup and provider/permission verification. No deployment authorized/performed yet.

Kent confirmed October 16: Monday.com remains the official system of record while its subscription continues. Selected employees will learn/test the new app; presentation planned for early next week. Company Vercel Pro team is **Carts and Parts**, slug `carts-and-parts`, team ID `team_BILBKtR9HGBoDRxhFt3WJDew`. Personal `kenthefleys-projects` is not an authorized company deployment target.

## Acceptance criteria

October 17 environment implementation plan: centralize explicit development/pilot target validation; retain existing development defaults and reject unsupported/live/mixed targets; scope storage keys by mode; intersect pilot email/invitation settings with Kent's approved three-address list; label the app Pilot and preserve Monday.com guidance. Verify pure policy rejection paths, existing email/invitation/store regressions, development build and runtime, then a separate pilot-config build. No outbound messages, deployment or local development credential replacement during these checks.

- Verify company-team access before creating/linking a project. Preserve personal projects/connections.
- Prepare a dedicated pilot project and stable URL, with a clear Pilot label and Monday.com guidance.
- Use isolated pilot database/storage/credentials, preserving local development and future live targets. Current exact-development guards need deliberate, tested pilot configuration before deployment; simply copying current environment values is insufficient.
- Keep invitation-only Clerk access and server-side permissions; add the chosen pilot recipients to the non-live email/invitation allowlists only after Kent identifies them.
- Use sample orders by default; no Monday import or production data migration is authorized.
- Verify hosted login, create/edit/conflicts, assignments/bells, comments, email, private files, closeout/reopen, price books, calendars, reports, admin/Trash and cleanup.
- Configure and verify pilot-specific backups and restoration; current GitHub backup workflow covers the development environment only.
- Obtain authorization for the concrete first pilot deployment after configuration is reviewable. No live launch is authorized.

## Current access state

Company CLI device authorization succeeded; personal connector remains unchanged. Vercel CLI 64.5.0 uses the separately ignored `.vercel/company-auth` global config and explicit `--scope carts-and-parts`. Created and linked the empty project **carts-and-parts-operations-pilot**, ID `prj_JNid49dzev0RZ6FSKlHrPZxrAeOj`, under the verified company team. Configured Next.js, Node 24.x, `npm ci`, `npm run build` and nonpublic source. Project dashboard: https://vercel.com/carts-and-parts/carts-and-parts-operations-pilot . No deployments, Git connection or automatic Git deployment configured; no development credentials copied into Vercel.

The CLI link step added a Vercel OIDC token to .env.local. Verified existing database, Clerk, R2, Resend and Dropbox app settings remain present without printing values. Separate backup credentials remain ignored. Removed only CLI-added duplicate ignore rules, preserving the tracked placeholder .env.example exception.

Next resources: create isolated pilot Neon database/credentials and private R2 bucket/credentials, configure pilot Clerk access and trusted URL, then implement/test explicit pilot environment guards. Current local/development connections remain unchanged. Initial hosted deployment remains pending concrete configuration review and authorization.

## Pilot database preflight

Kent created Neon project **Carts and Parts Operations — Pilot**, project ID `rapid-dream-09248261`, and saved its pooled connection privately in ignored `.env.pilot.local`. Read-only verification succeeded: separate endpoint from development, PostgreSQL 18.6, database neondb, zero public tables. No migrations, records or database settings changed. The default branch label production refers to Neon naming, not authorization for live use. Development .env.local remains authoritative for local development. Next is a dedicated private R2 pilot bucket and its bucket-scoped credentials; do not copy development R2 credentials into the pilot.

## Presentation checklist

## Pilot storage preflight

Kent created `carts-parts-operations-pilot` with Standard storage; screenshot confirms Public Access Disabled. Created separate bucket-scoped Account API credentials and saved privately in .env.pilot.local. `node scripts/check-pilot-storage.mjs` passed: credentials differ from development; can list pilot bucket, upload/read identical synthetic bytes, delete and verify missing; access to development bucket denied with HTTP403. No development storage changes. Focused lint passed. Public custom domain/development URL settings and hosted upload CORS still need final review. Next configure separate pilot Clerk access; development auth remains unchanged.

Prepare sample workflows for order creation, assignment, comment notification, explicit email, private attachment and closeout. Provide employees a short test checklist and feedback log. Confirm pilot participants and presentation date/time with Kent when access/environment setup permits scheduling those checks.

## October 17 — explicit pilot runtime support

Implemented central development/pilot service-target checks, explicit hosted environment/project validation, separate pilot storage-key namespaces, and fail-closed pilot invitation/SO-recipient allowlists limited to Kent, Daryl and Jake. Pilot order emails carry a [PILOT] subject prefix. Added build-time Pilot labels and an authenticated-shell notice that Monday.com remains the official record. Existing development defaults and credentials are preserved; .env.pilot.local is ignored and contains separate pilot keys plus both pilot mode flags. Resend pilot key presence/format/separation verified without sending; provider acceptance is not yet verified.

Verified: nine environment/target/email/invitation unit tests; attachment policy tests; focused lint and TypeScript; development synthetic email, attachment and Trash regression scripts (fake providers, no outbound email); production builds with development and pilot configurations. Network-restricted initial checks failed and were rerun successfully with network access. Browser verified development and pilot sign-in labels on separate local ports; development Next MCP reported no compilation issues. Authenticated pilot workflows remain unverified because pilot users are not provisioned yet.

Pending: stable Vercel origin and environment variables, hosted R2 CORS, initial pilot admin/invitations, pilot backup coverage, hosted workflow verification, then explicit first-deployment authorization. No deployment, invitations, email sends, production migration or development data copy performed. Local test orders continue using DEV numbering; Pilot labels identify the testing environment.

October 17 pilot CORS verified after Kent saved the Cloudflare policy and confirmed public access settings: signed-URL OPTIONS preflight accepts only the assigned hosted pilot origin with PUT/content-type; unapproved origin is rejected. No files uploaded. Pilot admin provisioning, backup coverage and first-deployment authorization remain pending; Daryl/Jake invitations remain on hold for Kent to send Monday.

## October 17 — pilot administration and backup verification

Kent manually invited/accepted kent@cartsandparts.com in the separate pilot Clerk instance. Guarded bootstrap required exactly one active verified primary-email identity and first/last name, then created the initial ADMIN with display name in the empty pilot directory. Existing Super Admin rules protect that email; readonly checks confirmed exactly one active named Super Admin, zero orders and zero attachments after fixture cleanup. Daryl/Jake invitations remain on hold until Kent manually sends them Monday.

Extended existing backup scripts with explicit BACKUP_ENV=pilot, exact enrolled pilot service guards, pilot archive/file prefixes and archive environment validation. Development remains the default, and original version-1 development archives remain restorable. Pilot requires the existing recovery key; no replacement generated. Dropbox retention is isolated by environment prefix, keeps 30 days, and runs only after successful upload/download identity/revision/SHA-256 verification. The shared recovery key remains separate from Dropbox and is held in the company backup GitHub environment as an encrypted secret.

Verified nine target/environment/retention tests; focused lint; TypeScript; production build. Pilot populated-attachment drill archived/restored all 25 tables plus a synthetic PDF and its order/uploader association, then removed its source fixture and isolated restored database/files. Archive pilot-924a9a72ab04cb3f39e7468c.cnpbackup (17,042 bytes) uploaded/download-verified. After Super Admin provisioning, the full daily runner captured/uploaded pilot-5f6fa038f86a6e6ef7236cd9.cnpbackup (15,256 bytes), verified checksum and retention (zero expired). Legacy development-73cf5e0834277aeba7d2d017.cnpbackup also restored successfully: 25 tables, four files, one order attachment association, complete drill cleanup. Original records/files were not overwritten.

Configured separate GitHub pilot-backups environment with main-only branch restriction and ten encrypted secret names verified. Prepared .github/workflows/pilot-backups.yml for daily 10:47 UTC runs. **Pilot automatic scheduling is not active until Kent commits/pushes this workflow and a manual hosted run is verified.** Existing development backup workflow remains active and unchanged. No app deployment, SO email or agent-sent invitation occurred. Next: Kent pushes reviewed pilot changes; verify hosted pilot backup workflow; review concrete first pilot deployment and obtain authorization; then test hosted account/workflows before Monday invitations.

## October 17 — hosted pilot backup passed; first deployment pending

Verified pushed main commit da2960be81fe714cc7cfd9b90bf8194a156b649d. GitHub pilot workflow is active; manual run 39053304417 succeeded on Ubuntu/Node24/PostgreSQL18: encrypted pilot archive creation, Dropbox upload/download checksum verification and 30-day retention (zero expired). Archive pilot-45bc484bd7d995b5c49e98d0.cnpbackup, 15,245 bytes; recovery key not uploaded to Dropbox. Daily schedule remains 10:47 UTC; first timer-triggered run has not yet been observed. Run: https://github.com/KentHefley/carts-and-parts-operations/actions/runs/39053304417 .

Prepared .vercelignore to exclude private env/recovery/tooling/temp files and generated build assets; prebuild regenerates Prisma and PDF.js assets. Vercel CLI 64.5.0 deploy --dry --json --prod confirmed Next.js and a 1,770,370-byte source package: 339 regular files, zero forbidden paths, required application/build/migration inputs present. No upload or deployment occurred. This packaging file and this verification note are new local changes after the pushed commit. Pending: Kent authorization for the first company pilot deployment, then hosted auth/workflow/cron checks. No Daryl/Jake invitation or SO email sent.

## October 17 — first authorized pilot deployment

Kent explicitly authorized the first pilot deployment. Vercel company project carts-and-parts-operations-pilot is Ready: deployment dpl_5QA8XzukeMW7NrkwfkMsR5SUc8Yn, stable URL https://carts-and-parts-operations-pilot.vercel.app . Source is pushed commit da2960be81fe714cc7cfd9b90bf8194a156b649d plus the locally prepared .vercelignore and verification notes. No Git auto-deployment connection configured. Remote Node24 install, Prisma7 generation and Next16.3.8 production build succeeded. No development orders/books/events copied. Future live launch remains unauthorized.

Hosted verification passed: root, sales-orders and reports/export redirect signed-out visitors to app sign-in; sign-in returns200 and renders Pilot plus the correct separate Clerk application with no browser errors. No extra Vercel login is required at the stable employee URL; deployment protection was not changed. Maintenance without secret returns401. Authorized maintenance returns200 with zero checked/purged records, verifying deployed database/storage guards. Vercel reports cleanup schedule 09:00UTC enabled; first scheduled invocation remains unobserved. Pilot backup GitHub daily schedule is active and manual hosted run39053304417 passed.

Kent should now sign in with kent@cartsandparts.com and verify the Pilot notice, Dashboard and administrator sections, followed by hosted order/save/reopen/file/email/report/calendar checks. Authenticated hosted flows have not yet been verified. Pilot starts without orders, books or events; admins can upload books in the pilot UI. Daryl/Jake invitations remain unsent until Kent manually sends them Monday. No SO email sent during deployment. .vercelignore and these deployment notes still need a later commit/push.
