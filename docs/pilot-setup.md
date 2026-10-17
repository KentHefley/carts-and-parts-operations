# Hosted pilot preparation

Kent confirmed October 16: Monday.com remains the official system of record while its subscription continues. Selected employees will learn/test the new app; presentation planned for early next week. Company Vercel Pro team is **Carts and Parts**, slug `carts-and-parts`, team ID `team_BILBKtR9HGBoDRxhFt3WJDew`. Personal `kenthefleys-projects` is not an authorized company deployment target.

## Acceptance criteria

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
