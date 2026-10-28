# Remaining dependency security updates — October 27, 2026

The Next security/timestamp PR #2 was verified pushed at 0a5a4cd and merged into main as f839837. Separate follow-up branch: codex/dependency-security-updates.

Scope: compatible Prisma 7.10.1 CLI/client/PostgreSQL adapter; targeted semver-compatible zod and fast-uri transitive fixes. Do not upgrade Prisma major, change schema/migrations, send email, modify pilot records or add feature work. Preserve prior package/lock copies in ignored tmp/.

Acceptance: fresh audit reviewed with no known advisories remaining if supported versions permit; lockfile diff scoped; regenerate Prisma client; 52 unit tests, lint, TypeScript, production build and guarded development database/storage/email regressions pass. Test staged Vercel deployment and runtime before pilot promotion. Record remaining findings honestly. No schema migrations or resets.

Rollback: restore package files from prior commit and reinstall locked dependencies; retain prior Ready Vercel deployment dpl_4NscYHiynJjwVYPBucQyL1acKsW4 as the application rollback reference. Code rollback does not require database changes for this patch.

Local verification: Prisma CLI/client/adapter 7.10.1; fast-uri 3.1.9 and zod 4.6.7 resolved through their existing compatible ranges. Prisma validation/generation and read-only development database connection passed. All 52 TypeScript unit tests, lint, TypeScript and production build passed. Guarded development order/attachment/report/mocked-email integrations passed and cleaned synthetic fixtures. Fresh full npm audit returned zero findings at every severity. No schema or migration changes.

Completed: Vercel staged deployment dpl_44tH2MX41MQ2BcEHQR9cKp9scym6 built successfully with a clean npm audit, passed protected sign-in/report redirect checks, and was promoted to the stable pilot. Stable address was inspected and resolves to this Ready deployment; post-promotion sign-in returns 200 with Pilot/correct Clerk instance, Reports requires sign-in. PR #3 SonarCloud analysis passed for the dependency code commit. Authenticated hosted interactions were not re-run automatically; comprehensive development integration checks passed. No schema or migration changes and no pilot records modified. Previous dpl_4NscYHiynJjwVYPBucQyL1acKsW4 remains the rollback reference.
