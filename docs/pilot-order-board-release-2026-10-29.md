# Pilot order board release — October 29, 2026

Kent reviewed the local boards with persistent development samples and explicitly authorized pilot deployment. Scope: 50-row database cursor pages on Sales Orders and Completed Sales Orders, full-database Name/SO Number/Status filtering, consistent single-line rows, table-only scrolling/sticky headings, Load More, background loaded-range refresh and bulk-result retry handling. Existing permissions remain enforced.

## Target and database

- Verified company team/project: `carts-and-parts/carts-and-parts-operations-pilot`, `prj_JNid49dzev0RZ6FSKlHrPZxrAeOj`.
- Guarded Pilot validation passed before migration. Only `20261029010000_order_board_paging` was pending. Applied through `scripts/migrate-pilot.ts`; 18 completed migrations and both partial expression indexes verified afterward. The indexes alter no order fields or saved values.
- Before/after migration visible board counts: 8 open, 3 completed/voided. Total database records include drafts/Trash and are not the board count.
- Verified zero `development-board-review-2026-10-29-v1` seed events in Pilot. The 180 fictitious `[TEST]` orders remain in Development only. No seeder was run against Pilot; its development-target guard rejects Pilot.

## Deployment and checks

- Local source: HEAD `2a4d16c3501bfaddffd48ffdaad2a4d2796aa692` plus the reviewed, uncommitted order-board changes. Manual CLI deployment, not a Git-triggered release.
- Previous stable/rollback deployment: `dpl_FRYp6CKvuUM8dqoQUoxLHJu7yyQQ`.
- Staged with `--prod --skip-domain`: `dpl_Erjauvd89H84kTdBaq8soicXbbRD`, `https://carts-and-parts-operations-pilot-8rb7ke94q-carts-and-parts.vercel.app`.
- Remote npm ci reported zero known vulnerabilities. Next 16.4.3/Prisma 7.10.1 production build and TypeScript passed, including `/api/orders/board`. The employee-facing stable URL remained on the previous release during staging.
- Staged HTTP checks using authenticated Vercel deployment access passed: sign-in 200, correct Pilot label/pilot Clerk key, new board stylesheet 200, signed-out board API 401 and signed-out Sales Orders redirect. Employee authentication was not bypassed.
- Promoted the same tested production build. Inspection of `https://carts-and-parts-operations-pilot.vercel.app` resolves to the new Ready deployment; repeated stable-URL checks passed with the same stylesheet and protections.
- No emails, invitations, assignment changes, fixture writes or maintenance cleanup were triggered in Pilot. Signed-in pilot visual acceptance remains with Kent; prior authenticated local review and development database/component tests are documented in `testing.md`.

## Recovery and next step

Code can roll back to the previous deployment above. Code rollback does not reverse database migrations; these additive indexes can remain with the previous code. Do not drop indexes/reset data as part of a code rollback.

Kent can refresh the normal pilot page. With the present 8/3 matching records, Load More is correctly absent until a board/filter has more than 50 matches. Source and release notes await Kent's Git commit/push; no automatic Git integration was configured.
