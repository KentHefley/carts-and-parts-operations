# Pilot form and SO-email release — November 2, 2026

Kent reviewed Development and explicitly authorized Pilot release. Scope: retire Description of Service and AM Description controls while preserving values/history; move existing Miles after Travel Price and before items; remove both descriptions from new SO emails and place Miles before used items, retaining price exclusions. Core settings protection permits preserving inactive retired definitions but forbids changing their activation through normal administration. Job Type Maintenance/Maintenance CM and Other-last settings were already applied and verified in both environments.

## Target, settings and source

- Company project verified as `carts-and-parts/carts-and-parts-operations-pilot` (`prj_JNid49dzev0RZ6FSKlHrPZxrAeOj`). Separate Pilot database/R2/Clerk guards passed.
- Pilot has **no persisted `OrderFieldLayout` row** and uses source defaults (version 0). New defaults already provide the approved form. Guarded `update-service-layout.ts --environment=pilot --apply` reported `changed:false`; no settings, order values, history or email payloads were rewritten and no migration was needed.
- Readback before/after promotion verified the expected defaults and final Job Type sequence Maintenance, Maintenance CM, Other. Private pre-release layout-state snapshot is in ignored `tmp/pilot-service-layout-before-2026-11-02.json` (stored layout null).
- Source was HEAD `177799a6291648e5c751195f9d1887816a12ea6c` plus reviewed local changes; GitHub main matched that HEAD before this release. This is a manual CLI source deployment. Today's source/scripts/notes still await Kent's commit/push.

## Deployment and verification

- Previous stable/code rollback target: `dpl_Erjauvd89H84kTdBaq8soicXbbRD`.
- Staged with production target and `--skip-domain`: `dpl_8Yg6exs1abDaYyX48Wf76DchKPpf`, `https://carts-and-parts-operations-pilot-2spn2jm13-carts-and-parts.vercel.app`.
- Remote Next 16.4.3/Prisma 7.10.1 build and TypeScript passed. npm reported 23 moderate dependent-package findings (one unique minimatch advisory), zero high/critical; scoped review and follow-up are in `dependency-review-2026-11-02.md`. No automatic dependency fixes/lockfile changes.
- Staged and promoted stable-URL HTTP checks passed: sign-in 200, expected Pilot label and separate pilot Clerk key, stylesheet 200, signed-out board API 401 and protected Sales Orders redirect. No employee authentication bypass or real email-send test.
- Promoted the same tested deployment. Inspection of `https://carts-and-parts-operations-pilot.vercel.app` resolves to new Ready `dpl_8Yg6exs1abDaYyX48Wf76DchKPpf`. Kent's signed-in visual Pilot acceptance follows refreshing an order.
- Local verification remains recorded in `testing.md`: seven focused tests, custom-field and mocked-email integrations, form/print/email component assertions, responsive viewport, lint/types/build. No company orders, assignments, email snapshots, files or invitations were changed by this release. Development fixtures remain separate.

## Recovery and remaining work

At release time there was no saved Pilot layout, so rolling code back restores previous defaults. If an admin later persists a layout based on the new defaults, inspect/adjust the three affected core definitions through a guarded audited procedure before rolling back to code that cannot preserve inactive core definitions. Preserve unrelated new/custom definitions; do not delete/reset the saved layout or order data.

The transient Clerk retry/recovery recommendation remains unimplemented in `pilot-auth-incident-2026-11-02.md`. Dependency advisory review remains a separate pre-production task. Initial live launch and Git/Vercel automatic integration are not part of this release.
