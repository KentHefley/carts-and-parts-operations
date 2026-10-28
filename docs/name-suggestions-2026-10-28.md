# Saved name suggestions and apostrophe matching — October 28, 2026

Approved scope: customer/store report matching ignores straight and curly apostrophes as well as existing case/whitespace differences. Product matching remains unchanged. Suggest saved Invoice To names for Invoice To and saved Store Name values for Store Name during order entry; allow free text and preserve original saved spelling. No supplied customer list, fuzzy matching, aliases, automatic merging or address changes.

Implementation: shared name normalization; authenticated, bounded on-demand suggestions after two characters, debounced and protected from stale responses. Exclude Trash and unnamed drafts; include open/completed saved records. Keyboard-accessible optional list; failures never prevent manual entry or saving. No schema changes.

Acceptance/tests: Albertsons matches Albertson's and Albertson’s in customer/store reports, while Albejttsons does not. Saved values and product grouping unchanged. Separate suggestions by field, case/apostrophe deduplication, literal wildcard handling, bounded responses and current active-user authorization. Keyboard selection/click-away/manual entry and delayed-response safety. Report regression, development data access checks, lint/types and production build.

Implemented locally. All planned automated checks passed; browser used actual component with synthetic lookup stub for keyboard, pointer, async-race/failure and mobile checks. Full authenticated order review pending. Existing data unchanged; no pilot deployment.
