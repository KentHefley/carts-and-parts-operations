# Initial wireframe review

October 6, 2026. Planning preview only; no application code or services changed.

Interactive conversation preview: Dashboard, Sales Orders list and order details, with fictional sample orders. Other navigation destinations are placeholders for later screen review. Neutral colors and a logo placeholder are intentional; branded light/dark mockups follow layout review.

## Review scope

- Dashboard navigation for five main sections, admin-only destinations, and open orders assigned to the viewer; no calendar widgets.
- Compact list with the seven agreed columns and search/filter control placement.
- Form tabs: Order Details, Files, Updates and Activity Log.
- All six form sections in the agreed sequence. Additional Information and Completion precede Service and Labor.
- Three starting item rows and Add Item. Assignment and Send SO Email remain together.
- AM Description is manual text; Labor Price and Travel Price are manual inputs. Time In/Out are time controls; Hours Worked is a calculated read-only output.
- Specialized parts, additional parts, cart counts and legacy closeout controls remain visible for placement review when Service and Labor is expanded.

## Limits and proposals

- The order view focuses on panel contents; final wide slide-out behavior, retained list position and full-screen mobile behavior still require implementation/design verification.
- Terms, Freight-Shipping and Job Type now use Kent's confirmed October 6 option lists in requirements.md. Blank selection remains available; no first-option default was requested. Other dropdowns still use illustrative choices.
- No Service/Maint/Service choice is in the new Job Type list. Automatic expansion trigger is pending clarification; Service and Labor can be expanded manually.
- Existing duplicate completed-board Miles/WO Additional Info fields and source Subitems/Item ID mappings remain in the inventory. Their final presentation is not resolved by this wireframe.
- Monetary totals, Hours Worked, sorting, filter behavior, autosave, authentication and permissions are not implemented here. Search and Add Item are local preview interactions. Email/file/comment/status buttons demonstrate placement without external actions.
- JavaScript syntax was checked successfully. The local browser preview connection timed out; rendered layout and interactions have not been browser-verified.

## Feedback needed

Latest completion revision: removed Legacy Voided checkbox, required Closed Out By/Date on Complete/Voided, and moved action buttons beneath the fields. Preview checks Name and the two closeout inputs and moves the sample order into Completed Sales Orders. Status-box terminal choices use the same preview check. This is local simulation only; production server validation and persisted history are not implemented. Script syntax checked; browser verification remains pending.

Review navigation, list readability, form section order and field placement. Record corrections before creating the branded mockups. This wireframe does not approve proposed placements or resolve pending business calculations.

Kent reviewed and liked the initial wireframe on October 6, 2026, then supplied the three dropdown lists above. Updated the preview to reflect those lists and retained admin add/remove behavior in the requirements.

Subsequent October 6 feedback: Status is a color-coded box like Monday.com, not a native select dropdown. Updated the form editor and list status badges with proposed colors; the box opens selectable status buttons. Added all seven confirmed divisions in Kent's listed order, retaining the blank option. Final colors await styling review.
