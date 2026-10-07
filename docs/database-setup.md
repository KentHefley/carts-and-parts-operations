# Development database setup

October 7, 2026. Kent selected the stable Prisma 7 line with Neon PostgreSQL. Installed CLI, client and PostgreSQL adapter are pinned to 7.10.0. Node 24.16.0 and TypeScript 5.9.3 meet documented requirements. Prisma uses Apache-2.0 licensing. No paid Prisma service is required for this setup.

Existing `.env.local` credentials are preserved. Prisma CLI explicitly loads that file; the application reads server-only DATABASE_URL. Database connections use explicit certificate/hostname verification, a 10-second connection timeout and a small per-process pool. The client is reused during application execution.

## Completed

- Generated Prisma Client and validated the initial AppUser schema.
- Executed read-only `SELECT 1` through Prisma's PostgreSQL adapter; returned connected=true, including after explicit TLS verification was enabled.
- Added reproducible db:generate, db:validate and db:check npm scripts. Build generates its client first; generated files are ignored by Git and lint.
- Applied the additive initial-access migration to the verified development database. AppUser stores stable internal ID, unique Clerk user ID/email, User/Admin role and active flag.
- Provisioned kent@cartsandparts.com after a read-only Clerk lookup matched exactly one active account with that verified primary email. Repeating bootstrap preserves the same approved administrator; it does not duplicate or change permissions.
- Added server-side approved-user/admin helpers. Access requires a valid Clerk session, a matching active database record and verified primary email; banned/locked accounts are denied. The setup page uses this guard. Other authenticated accounts see an approval message without company data.

## Next increment

The version-controlled migration is prisma/migrations/20261007180000_initial_access/migration.sql. `npm run db:migrate:development` checks development Clerk keys, the verified Neon endpoint/database and expected existing-table scope before applying migrations. This initial-access guard intentionally stops if unrelated tables exist; revise the expected scope as future reviewed migrations add order tables. The Neon project's default branch is named production, but Kent's supplied project screenshot identifies the project as Development. Do not treat a branch name as proof of environment.

`npm run admin:bootstrap:development` resolves the explicitly selected account and is limited to an empty user directory or the same already-active administrator. It cannot promote/reactivate an existing different record. No Clerk account, invitation or provider metadata was created/changed. Other accounts still require explicitly approved active database records. Prevent removal of the last active administrator before user-management controls are introduced.

Order/employee relations and the full mapped field schema remain the next milestone. The only application record created so far is Kent's approved admin account; no historical imports or sales orders were created.

## Checks and limitations

Connection query, client generation, schema validation, production build and TypeScript passed. Lint completed with zero errors and one existing skill-template warning. Three access-policy tests cover approved access and denial for unknown/inactive/mismatched/unverified/banned/locked accounts. Signed-out browser redirect passed; Next.js compilation/runtime diagnostics were empty. Browser verification of approved versus unapproved/inactive signed-in accounts still needs authorized test accounts. Password recovery/password-based sign-in and last-admin safeguards remain to be tested as those workflows are implemented.

npm audit now reports nine high-severity package entries across tooling dependency chains: existing ESLint/braces plus Prisma CLI/deepmerge-ts/mysql2. The application uses PostgreSQL, not MySQL; no forced major-version downgrade was applied. Review compatible remediation before release.

References: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 and https://www.prisma.io/docs/orm/supported-databases
