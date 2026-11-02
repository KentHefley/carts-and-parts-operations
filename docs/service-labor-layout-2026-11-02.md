# Service and Labor layout update — November 2, 2026

Release follow-up: Kent reviewed Development and authorized Pilot deployment. Ready `dpl_8Yg6exs1abDaYyX48Wf76DchKPpf` is promoted and verified. Pilot uses updated source defaults, so no persisted layout/order write was needed. See `pilot-service-layout-release-2026-11-02.md`; this supersedes the local-only status in the implementation record below.

Kent approved removing Description of Service (`text_32__1`) and AM Description (`text14__1`) from the form and new SO emails. Preserve their saved values and immutable history; retire the controls rather than deleting data. Move the existing Miles field (`numbers__1`) into Items and Pricing immediately after Travel Price (`text0__1`) and before item rows; keep its key/type/values.

Kent confirmed that prices remain excluded from SO email. Email Miles moves immediately before the used item rows, including when its value is blank. Preserve other selected blank values, compact separators, original item numbering, HTML escaping and omission of unused items. Existing queued email snapshots/retries remain immutable; do not send actual emails during checks.

Implementation plan: update defaults and email selection; apply an explicit, audited/version-checked saved-layout update to Development; protect inactive core definitions from reactivation while allowing unrelated layout saves; verify form/print placement, history/value retention, custom-field settings and email generation. Pilot configuration/code release follows local review, so form and email changes can ship together.

Acceptance: both retired controls absent; Miles immediately follows Travel Price and is last before items; existing values/other field definitions unchanged; field settings still save; retired core state cannot be toggled through normal administration; text/HTML emails omit the removed fields and all prices, put Miles before items, preserve zero/blank Miles and existing item/escaping rules. Run focused unit/integration checks, source lint/types, production build and responsive component review.

Implemented/verified locally: Development saved layout applied and repeat preview reports no change. Seven unit checks, custom-field/mocked-email integrations, source lint/types/build, Next route compilation and 11 synthetic-browser assertions passed. No actual sends or Pilot update. Preserve the matching saved-layout/code versions when releasing to Pilot; do not run the Pilot settings update as an isolated change ahead of the new email/field-protection code.
