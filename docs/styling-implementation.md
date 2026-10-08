# Approved mockup styling milestone — October 8

Use the approved styled mockup's light/dark colors, company logos, blue accents, orange-yellow actions, sidebar, top bar, cards, compact tables, form panels and spacing. Add a remembered theme and sidebar preference, keyboard focus states and mobile navigation. Keep live notification and Clerk controls.

Make Dashboard the landing route; place active orders at `/sales-orders`, retaining Completed Sales Orders and All Activity. Show the signed-in user's active assignments on Dashboard. Clearly mark unimplemented navigation sections as unavailable; do not introduce mock business data. Preserve existing order saves, conflicts and field mappings.

Acceptance: live navigation opens the correct screen; both themes show readable logos/controls; preferences survive reload; mobile navigation and tables fit; order edits retain three-second autosave and conflict protection. Verify lint/build, order regression, runtime diagnostics and browser visual checks. A slide-out order interaction and remaining unimplemented sections will need subsequent work; this milestone styles current routed forms without pretending those interactions exist.
