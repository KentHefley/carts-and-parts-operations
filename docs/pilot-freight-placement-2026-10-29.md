# Pilot Freight placement release — October 29, 2026

Kent reviewed development and explicitly authorized pilot deployment. Scope: default Freight text field text772__1 moved from Items and Pricing to Service and Labor immediately after In House Refurbs text5__1. Freight-Shipping dropdown freight__1 remains unchanged. No order values/schema changes.

Development saved layout corrected using guarded scripts/move-freight-field.ts --environment=development --apply; readback preserves other field definitions and repeated application changes nothing. The pilot read-only preview already matched the desired placement, so no pilot settings write was needed. Verified again after deployment (changed:false).

Company pilot target verified: carts-and-parts/carts-and-parts-operations-pilot, prj_JNid49dzev0RZ6FSKlHrPZxrAeOj. Previous stable dpl_7RTreapmcBwBU96f6n85ufY1tpZx retained as code rollback target. Staged dpl_FRYp6CKvuUM8dqoQUoxLHJu7yyQQ passed remote install (zero known advisories), Next16.4.3/Prisma7.10.1 build and TypeScript. Default-layout assertions passed Freight section/predecessor and unchanged dropdown section. Hosted staged sign-in/Pilot/Clerk/static stylesheet checks passed.

Promoted dpl_FRYp6CKvuUM8dqoQUoxLHJu7yyQQ; stable https://carts-and-parts-operations-pilot.vercel.app resolves to new Ready release. Stable sign-in200/Pilot/correct Clerk and pilot read-only saved layout checks passed. Signed-in visual pilot review remains with Kent. No emails, invitations or maintenance cleanup triggered. Code rollback does not reverse database changes; this release made none in pilot.

Source changes and these release notes await Kent's commit/push.
