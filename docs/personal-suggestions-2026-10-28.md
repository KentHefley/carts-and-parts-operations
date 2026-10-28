# Personal description suggestions — October 28, 2026

Approved: optional user-specific suggestions for item descriptions and Description of Service. Invoice To and Store Name remain shared. No Job Type changes or automatic values/prices/quantities.

Source: immutable order save history scoped to the authenticated actor, only actual changes to the relevant description, including work on another creator's order. Suggest text still present on a saved open/completed order; exclude Trash, voided and unnamed drafts. Quantity/price-only item edits do not teach the actor another employee's text. Keep separate item/service pools and full exact saved text. Rank recent/frequent saved variants, max ten suggestions; free entry allowed and no schema migration or historical rewrite.

Acceptance: two users never receive one another's personal descriptions unless each actually saved that text; creator/assignee status alone does not grant personal-history suggestions. Server ignores any client actor identity. Current employee approval checked; inactive/deletion-pending denied. Shared-name behavior unchanged. Existing debounce/stale response/keyboard/click-away/manual entry behavior reused. Verify database isolation, real save history, exclusions, row-specific selection, report regressions, lint/types/build and mobile component preview.

Completed locally. Development real-save integration, lint/types, 18 report/export tests, production build and component browser/mobile checks passed. Next runtime clear. No schema/pilot changes or deployment. Test manually by saving an item/service description, opening another order under the same login and typing two characters; another employee receives only their own history.
