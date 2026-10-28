# Pilot release — October 28, 2026

Authorized by Kent after commit/push. Source: 68c49375a37b11471bb4fe6d287a4fbed59b65b8, matching local main and origin/main. Company project prj_JNid49dzev0RZ6FSKlHrPZxrAeOj under Carts and Parts/team_BILBKtR9HGBoDRxhFt3WJDew.

Previous stable deployment: dpl_44tH2MX41MQ2BcEHQR9cKp9scym6. Staged release: dpl_A39coWWxWtstntCrU3xknp9ZxkoY, https://carts-and-parts-operations-pilot-pmn0jjp7v-carts-and-parts.vercel.app . Remote locked install, Next16.4.3/Prisma7.10.1 generation, compilation, TypeScript and production build passed; install reports zero advisories.

Scope: Terms highlighting, Pending Credit display, Freight-Shipping choices, Store Name reporting, vacation blackout notices, Super Admin-only order configuration, shared customer/store suggestions and personal item/service suggestions. No schema migration or copied development records.

Targets: pilot environment/bucket/public Clerk configuration verified against enrolled pilot configuration. Provider-managed secret values were not printed or replaced. Guarded read-only pilot checks passed new suggestion/blackout/Store Name report queries and confirmed approved Super Admin.

Freight preview: existing CPU, FOB Delivered, Freight Collect, Prepaid + Add, NA; desired CPU, FOB Delivered, In-House Delivery, Prepaid + Add. Apply with guarded scripts/update-freight-choices.ts --environment=pilot --apply after staged checks. The update is transactional/audited, deactivates old choices and preserves historical order values.

Code rollback: promote previous dpl_44tH2MX41MQ2BcEHQR9cKp9scym6 to the pilot if needed. This does not reverse database settings or user-entered data. The freight update is compatible with the prior release; restore choice activation/order separately through reviewed settings if required. Calendar blackouts use a separate existing entry kind and personal suggestions read existing audit history.

Staged hosted checks and final promotion/readback are recorded below when complete. No real SO emails, employee invitations or authenticated maintenance cleanup are part of this release verification.

Completed: staged sign-in 200/Pilot/correct separate Clerk application; Reports, Super Admin settings and employee calendar redirect signed-out visitors (307); unauthenticated maintenance returns401. Stable address was verified on the old deployment before mutation/promotion. Applied Freight-Shipping choices transactionally and read back CPU, FOB Delivered, In-House Delivery, Prepaid + Add. Promoted dpl_A39coWWxWtstntCrU3xknp9ZxkoY successfully. Stable https://carts-and-parts-operations-pilot.vercel.app resolves to the new Ready release; direct sign-in200/Pilot/correct Clerk and protected Store Name Reports307 verified afterward. No schema migration, real emails, invitations or order changes. Authenticated hosted workflow review remains with Kent/team; local signed-in feature tests were already confirmed by Kent.

Status-cursor follow-up: Kent authorized deployment of the one-line CSS pointer rule after the feature-batch commit. Remote build/TypeScript passed. Staged dpl_7RTreapmcBwBU96f6n85ufY1tpZx passed hosted sign-in/Pilot/Clerk and actual published CSS rule checks, then was promoted. Stable pilot resolves to this Ready release and the same hosted checks passed after promotion. Previous release dpl_A39coWWxWtstntCrU3xknp9ZxkoY remains the immediate code rollback target. No database/settings changes in this follow-up. Cursor source and release notes still require Kent's next commit/push.
