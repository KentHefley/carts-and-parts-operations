# Development verification

October 7, 2026. Use synthetic orders in the development environment. This app is not yet the company system of record.

## Order persistence checks

`npm run test:orders` passed against the verified development database: safe concurrent numbering, idempotent retries, initial defaults, Name validation, related item persistence/reopen, independent-field merging, competing-field/item rejection and audit deduplication. The script removes its own synthetic fixtures and never resets the number sequence.

`npm run build` passed TypeScript and production compilation. `npm run lint` passed with an existing warning in a skill example. Next.js runtime compilation diagnostics returned no issues. Approved-access policy tests passed in the preceding increment.

## Employee browser checklist — pending

1. Sign in using the approved employee account. Never share passwords or verification codes in chat.
2. Click New Order. Confirm an immediate DEV-prefixed SO number, In Progress status, blank Division and three item rows.
3. Enter a synthetic Name and optional form values. Confirm Saving changes to Saved.
4. Enter item description, quantity and unit price; add a fourth row. Confirm Saved.
5. Return to Sales Orders, search the SO number and reopen it. Reload and confirm saved values remain.
6. Open the same order in two tabs. Different-field edits should merge; competing edits should show a conflict without losing typed input.
7. Check narrow-screen usability and keyboard navigation. Verify input is retained after a failed save and retry works.

Authenticated browser testing confirmed New Order immediately generated DEV-000010, In Progress, blank Division and three rows. Name/Purchase Order and item values autosaved; a fourth row was added and the saved order appeared in Sales Orders. Testing exposed stale Saved feedback during item edits; corrected item edit/add handlers to show Unsaved changes immediately. The synthetic browser order remains available for review.

The Codex embedded browser repeatedly returned to sign-in during navigation. No authentication error appeared in its console, and no definitive cause is established. Browser reopening/reload and sustained-session verification remain blocked; database-level reopen tests passed. Compare the same workflow in a regular browser before assuming the problem is embedded-browser-specific. Do not weaken authentication or change session settings speculatively. Separate authorized accounts are still needed for inactive/unapproved browser denial checks. Password recovery/logout remain unverified.
