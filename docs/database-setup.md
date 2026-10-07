# Development database setup

October 7, 2026. Kent selected the stable Prisma 7 line with Neon PostgreSQL. Installed CLI, client and PostgreSQL adapter are pinned to 7.10.0. Node 24.16.0 and TypeScript 5.9.3 meet documented requirements. Prisma uses Apache-2.0 licensing. No paid Prisma service is required for this setup.

Existing `.env.local` credentials are preserved. Prisma CLI explicitly loads that file; the application reads server-only DATABASE_URL. Database connections use explicit certificate/hostname verification, a 10-second connection timeout and a small per-process pool. The client is reused during application execution.

## Completed

- Generated Prisma Client and validated the initial AppUser schema.
- Executed read-only `SELECT 1` through Prisma's PostgreSQL adapter; returned connected=true, including after explicit TLS verification was enabled.
- Added reproducible db:generate, db:validate and db:check npm scripts. Build generates its client first; generated files are ignored by Git and lint.
- Prepared AppUser schema with stable internal ID, unique Clerk user ID/email, User/Admin role and active flag. It has not been applied to the database.

## Next increment

Prepare a version-controlled additive migration after verifying the database target against the development project. The Neon project's default branch is named production, but Kent's supplied project screenshot identifies the project as Development. Do not treat a branch name as proof of environment.

Resolve kent@cartsandparts.com to its verified Clerk user ID and provision that exact account as the initial admin using a controlled bootstrap command. Do not auto-approve arbitrary logins. Other accounts require explicitly approved active database records. Keep Clerk authentication distinct from application approval and roles. Guard all privileged server resources; no company records are available in the current setup page.

Order/employee relations and the full mapped field schema remain the next milestone. No migrations, writes, historical imports or admin provisioning were run during this connection setup.

## Checks and limitations

Connection query, client generation and schema validation passed. Lint completed with zero errors and one existing skill-template warning. Build result is recorded in progress.md. Password recovery/password-based sign-in and employee approval/deactivation remain to be tested.

npm audit now reports nine high-severity package entries across tooling dependency chains: existing ESLint/braces plus Prisma CLI/deepmerge-ts/mysql2. The application uses PostgreSQL, not MySQL; no forced major-version downgrade was applied. Review compatible remediation before release.

References: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 and https://www.prisma.io/docs/orm/supported-databases
