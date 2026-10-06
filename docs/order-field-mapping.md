# Order field mapping for review

Prepared October 5, 2026 from the original planning conversation, later approvals, and verified Monday metadata. This is a review document, not an approved schema or implemented form.

## Confirmed foundation

Preserve every source field. Keep the agreed six-section order: Order Overview; Billing and Store Information; Items and Pricing; Additional Information; Completion; Service and Labor. Service and Labor is collapsible. The precise placement of individual fields below is proposed unless already specified in requirements.md/screens.md.

The screenshots illustrated specific features, not complete boards. The email deliberately selects a subset of fields. Existing source types and formulas do not define the new application's business rules. No source values are merged or discarded by this mapping, and no historical import is authorized.

## Proposed layout

| Section | Content and treatment |
| --- | --- |
| Order Overview | Name, SO Number, Status, Date Entered, Division, Purchase Order, Scheduled Job Date, Salesperson, Job Type, Priority, read-only Submitted By. |
| Billing and Store Information | Separate invoice and store address/contact groups; preserve ZIP, phone and store-number formatting. Store Email Address does not become an SO email recipient. |
| Items and Pricing | Three default quantity/description/unit-price rows with Add Item; Terms, NTE, Price Level; distinct shipping choice and Freight field; labor/travel descriptions and prices; derived Order Total. Charge placement and calculation details need review. |
| Additional Information | Additional Info, Assigned To, Send SO Email together as agreed. |
| Completion | Current completion/void metadata and actions. Preserve separate legacy Closed Out By/Date and Voided checkbox until their relationship is explained. |
| Service and Labor | Service description, AM Description, technicians, time/hours, cart counts, refurb details, specialized part groups, four extra part groups and WO Additional Info. Preserve these groups separately until any consolidation is approved. |
| Source reference / workflow review | Monday Item ID is omitted from the employee-facing form, as confirmed by Kent. Preserve it in this source inventory only; carry an external reference into the application only if a later approved migration/integration needs it. The app has its own stable internal order ID. Subitems have their own Name/Owner/Status/Date schema; their usage is unverified and they are not assumed to be item rows. |

New application fields include Order Total, Completed By, Voided By, Voided Date and optional Void Reason. They were not returned as top-level Monday columns. Existing Completion Date is a source column. Internal IDs, audit, conflict, email, notification and Trash metadata remain separately defined application records.

## Confirmed field controls and review focus

Kent clarified that the inventory should focus on field types rather than interpreting abbreviations or ordinary business labels.

| Field | Verified Monday type | Confirmed entry / behavior |
| --- | --- | --- |
| AM Description | text | Manually entered text in labor inputs; keep its label. Its abbreviation is unknown; no time-only control or calculation. |
| Labor Price | text | Manually entered amount; no hours-based calculation. |
| Travel Price | text | Manually entered amount; no miles-based calculation. |
| Time In / Time Out | hour | Time inputs used by Hours Worked. |
| Hours Worked | formula | Automatically calculated from Time In and Time Out. |

The earlier AM/morning-time interpretation is superseded. Group AM Description with labor inputs in the form; exact placement is still part of wireframe review. Source text types for prices remain distinct from the proposed validated monetary inputs needed for agreed totals.

Retain all other fields with their verified source types and preserve distinct duplicate columns. Defer calculation-specific questions to the relevant design/implementation step: total participation of specialized parts/freight, Hours Worked edge cases, and any linkage between legacy closeout fields and automatic status metadata. Do not infer new enforcement rules from NTE or merge source fields based on their names. The Maint/Service trigger and duplicate mapping still require review, without asking Kent to define every field's business meaning.

## Recommendations awaiting review

- Put monetary inputs in Items and Pricing while keeping service execution details in the final collapsible section.
- Keep the specialized and extra part groups intact initially; normalize them into reusable rows only after their billing/reporting relationship is confirmed.
- Preserve NTE's existing text input; do not add an enforcement rule based on its label.
- Keep a separate external-source mapping keyed by board ID plus column ID. Duplicate titles and reused IDs across boards must not collapse distinct values.

## Complete source-column coverage

Every returned top-level order column appears once below, with its original label/type and proposed section. Repeated generic Price/QTY rows remain distinct by source ID; their pairing follows the original source sequence and requires business confirmation. Email inclusion stays exactly as defined in field-inventory.md and requirements.md.

### Sales Orders — board 6554539589

| Source column ID | Exact label | Source type | Proposed section |
| --- | --- | --- | --- |
| name | Name | name | Order Overview |
| subitems__1 | Subitems | subtasks | Source reference / workflow review |
| text8__1 | Sales Order Auto # | text | Order Overview |
| status__1 | Status | status | Order Overview |
| date_entered0__1 | Date Entered | date | Order Overview |
| division__1 | Division | dropdown | Order Overview |
| item_id__1 | Item ID | item_id | Source reference / workflow review |
| text_28__1 | Purchase Order | text | Order Overview |
| start_job_date__1 | Scheduled Job Date | date | Order Overview |
| date__1 | Completion Date | date | Completion |
| dup__of_text3__1 | Salesman | text | Order Overview |
| dropdown__1 | Job Type | dropdown | Order Overview |
| priority__1 | Priority | dropdown | Order Overview |
| terms__1 | Terms | dropdown | Items and Pricing |
| text_12__1 | NTE | text | Items and Pricing |
| dup__of_priority__1 | Price Level | dropdown | Items and Pricing |
| freight__1 | Freight-Shipping | dropdown | Items and Pricing |
| numbers__1 | Miles | numbers | Service and Labor |
| text_13__1 | Invoice To | text | Billing and Store Information |
| text_16__1 | Inv Address | text | Billing and Store Information |
| text_17__1 | Inv City | text | Billing and Store Information |
| text_18__1 | Inv State | text | Billing and Store Information |
| text_19__1 | Inv Zip | text | Billing and Store Information |
| text_15__1 | Inv Contact Name | text | Billing and Store Information |
| text71__1 | Invoice Phone | text | Billing and Store Information |
| text_21__1 | Store Name | text | Billing and Store Information |
| text_22__1 | Store Number | text | Billing and Store Information |
| text_24__1 | Store Address | text | Billing and Store Information |
| text_25__1 | Store City | text | Billing and Store Information |
| text_26__1 | Store State | text | Billing and Store Information |
| text_27__1 | Store Zip | text | Billing and Store Information |
| text_23__1 | Store Contact | text | Billing and Store Information |
| text_30__1 | Store Phone | text | Billing and Store Information |
| text_31__1 | Email Address | text | Billing and Store Information |
| text_32__1 | Description of Service | text | Service and Labor |
| text_38__1 | Item Description 1 | text | Items and Pricing |
| text_33__1 | Quantity One | text | Items and Pricing |
| text_44__1 | Price 1 | text | Items and Pricing |
| text_40__1 | Item Description 2 | text | Items and Pricing |
| text_34__1 | Quantity Two | text | Items and Pricing |
| text_45__1 | Price2 | text | Items and Pricing |
| text_41__1 | Item Description 3 | text | Items and Pricing |
| text_35__1 | Quantity Three | text | Items and Pricing |
| text_46__1 | Price 3 | text | Items and Pricing |
| text81__1 | Labor Description | text | Items and Pricing |
| text06__1 | Labor Price | text | Items and Pricing |
| text32__1 | Travel Description | text | Items and Pricing |
| text0__1 | Travel Price | text | Items and Pricing |
| text14__1 | AM Description | text | Service and Labor |
| additional_info__1 | Additional Info | long_text | Additional Information |
| text_51__1 | Submitted By | text | Order Overview |
| people__1 | Forward to | people | Additional Information |
| button__1 | Send SO Email | button | Additional Information |
| text7__1 | Tech 1 | text | Service and Labor |
| text9__1 | Tech 2 | text | Service and Labor |
| hour__1 | Time In | hour | Service and Labor |
| hour6__1 | Time Out | hour | Service and Labor |
| formula__1 | Hours Worked | formula | Service and Labor |
| text61__1 | Multiple Day Hours | text | Service and Labor |
| text322__1 | # Of Techs | text | Service and Labor |
| total_shopping_cart__1 | Total Shopping Cart | numbers | Service and Labor |
| total_backroom__1 | Total Backroom | numbers | Service and Labor |
| total_ada__1 | Total ADA | numbers | Service and Labor |
| __scrapped__1 | # Scrapped | numbers | Service and Labor |
| __repaired__1 | # Repaired | numbers | Service and Labor |
| __cleaned__1 | # Cleaned | numbers | Service and Labor |
| __unavailable__1 | # Unavailable | numbers | Service and Labor |
| text5__1 | In House Refurbs | text | Service and Labor |
| text772__1 | Freight | text | Items and Pricing |
| text_65__1 | WH515PO QTY | text | Service and Labor |
| text6__1 | Price | text | Service and Labor |
| text_66__1 | CC5SW QTY | text | Service and Labor |
| text92__1 | Price | text | Service and Labor |
| text_69__1 | Leg Hole Closure QTY | text | Service and Labor |
| text_67__1 | Price | text | Service and Labor |
| text_68__1 | Seat Belt QTY | text | Service and Labor |
| text87__1 | Price | text | Service and Labor |
| text_70__1 | HDL QTY | text | Service and Labor |
| text_71__1 | Price | text | Service and Labor |
| text85__1 | Part Description 1 | text | Service and Labor |
| text39__1 | QTY | text | Service and Labor |
| text70__1 | Price | text | Service and Labor |
| text75__1 | Part Description 2 | text | Service and Labor |
| text72__1 | QTY | text | Service and Labor |
| text50__1 | Price | text | Service and Labor |
| text79__1 | Part Description 3 | text | Service and Labor |
| text03__1 | QTY | text | Service and Labor |
| text01__1 | Price | text | Service and Labor |
| text4__1 | Part Description 4 | text | Service and Labor |
| text40__1 | QTY | text | Service and Labor |
| text84__1 | Price | text | Service and Labor |
| text_78__1 | WO Additional Info | text | Service and Labor |
| check1__1 | Voided | checkbox | Completion |
| text_79__1 | Closed Out By | text | Completion |
| closed_out_date4__1 | Closed Out Date | date | Completion |

### Complete Sales Orders — board 6612672396

| Source column ID | Exact label | Source type | Proposed section |
| --- | --- | --- | --- |
| name | Name | name | Order Overview |
| subitems__1 | Subitems | subtasks | Source reference / workflow review |
| text8__1 | Sales Order Auto # | text | Order Overview |
| status__1 | Status | status | Order Overview |
| date3__1 | Date Entered | date | Order Overview |
| division__1 | Division | dropdown | Order Overview |
| item_id__1 | Item ID | item_id | Source reference / workflow review |
| text_28__1 | Purchase Order | text | Order Overview |
| date_entered0__1 | Scheduled Job Date | date | Order Overview |
| completed_date__1 | Completion Date | date | Completion |
| dup__of_text3__1 | Salesman | text | Order Overview |
| job_type__1 | Job Type | dropdown | Order Overview |
| priority__1 | Priority | dropdown | Order Overview |
| terms__1 | Terms | dropdown | Items and Pricing |
| text_12__1 | NTE | text | Items and Pricing |
| dup__of_priority__1 | Price Level | dropdown | Items and Pricing |
| freight__1 | Freight-Shipping | dropdown | Items and Pricing |
| numeric_mm656szg | Miles | numbers | Service and Labor |
| text_13__1 | Invoice To | text | Billing and Store Information |
| text_16__1 | Inv Address | text | Billing and Store Information |
| text_17__1 | Inv City | text | Billing and Store Information |
| text_18__1 | Inv State | text | Billing and Store Information |
| text_19__1 | Inv Zip | text | Billing and Store Information |
| text_15__1 | Inv Contact Name | text | Billing and Store Information |
| text__1 | Invoice Phone | text | Billing and Store Information |
| text_21__1 | Store Name | text | Billing and Store Information |
| text_22__1 | Store Number | text | Billing and Store Information |
| text_24__1 | Store Address | text | Billing and Store Information |
| text_25__1 | Store City | text | Billing and Store Information |
| text_26__1 | Store State | text | Billing and Store Information |
| text_27__1 | Store Zip | text | Billing and Store Information |
| text_23__1 | Store Contact | text | Billing and Store Information |
| text_30__1 | Store Phone | text | Billing and Store Information |
| text_31__1 | Email Address | text | Billing and Store Information |
| text_32__1 | Description of Service | text | Service and Labor |
| text_38__1 | Item Description 1 | text | Items and Pricing |
| text_33__1 | Quantity One | text | Items and Pricing |
| text_44__1 | Price 1 | text | Items and Pricing |
| text_40__1 | Item Description 2 | text | Items and Pricing |
| text_34__1 | Quantity Two | text | Items and Pricing |
| text_45__1 | Price2 | text | Items and Pricing |
| text_41__1 | Item Description 3 | text | Items and Pricing |
| text_35__1 | Quantity Three | text | Items and Pricing |
| text_46__1 | Price 3 | text | Items and Pricing |
| text80__1 | Labor Description | text | Items and Pricing |
| text_78__1 | Labor Price | text | Items and Pricing |
| text0__1 | Travel Description | text | Items and Pricing |
| text3__1 | Travel Price | text | Items and Pricing |
| text03__1 | AM Description | text | Service and Labor |
| additional_info__1 | Additional Info | long_text | Additional Information |
| text_51__1 | Submitted By | text | Order Overview |
| people__1 | Forward to | people | Additional Information |
| button__1 | Send SO Email | button | Additional Information |
| text_52__1 | Tech 1 | text | Service and Labor |
| text37__1 | Tech 2 | text | Service and Labor |
| hour9__1 | Time In | hour | Service and Labor |
| hour8__1 | Time Out | hour | Service and Labor |
| formula__1 | Hours Worked | formula | Service and Labor |
| text2__1 | Multiple Day Hours | text | Service and Labor |
| text21__1 | # Of Techs | text | Service and Labor |
| total_shopping_cart__1 | Total Shopping Cart | numbers | Service and Labor |
| total_backroom__1 | Total Backroom | numbers | Service and Labor |
| total_ada__1 | Total ADA | numbers | Service and Labor |
| __scrapped__1 | # Scrapped | numbers | Service and Labor |
| __repaired__1 | # Repaired | numbers | Service and Labor |
| __cleaned__1 | # Cleaned | numbers | Service and Labor |
| __unavailable__1 | # Unavailable | numbers | Service and Labor |
| text_79__1 | In House Refurbs | text | Service and Labor |
| text034__1 | Freight | text | Items and Pricing |
| text_66__1 | WH515PO QTY | text | Service and Labor |
| text_65__1 | Price | text | Service and Labor |
| text_68__1 | CC5SW QTY | text | Service and Labor |
| text_67__1 | Price | text | Service and Labor |
| text_70__1 | Leg Hole Closure QTY | text | Service and Labor |
| text_69__1 | Price | text | Service and Labor |
| text_72__1 | Seat Belt QTY | text | Service and Labor |
| text_71__1 | Price | text | Service and Labor |
| text_74__1 | HDL QTY | text | Service and Labor |
| text_73__1 | Price | text | Service and Labor |
| text_53__1 | Part Description 1 | text | Service and Labor |
| text_57__1 | QTY | text | Service and Labor |
| text_58__1 | Price | text | Service and Labor |
| text_75__1 | Part Description 2 | text | Service and Labor |
| text_76__1 | QTY | text | Service and Labor |
| text_77__1 | Price | text | Service and Labor |
| text_80__1 | Part Description 3 | text | Service and Labor |
| text_82__1 | QTY | text | Service and Labor |
| text6__1 | Price | text | Service and Labor |
| text_83__1 | Part Description 4 | text | Service and Labor |
| text_84__1 | QTY | text | Service and Labor |
| text_81__1 | Price | text | Service and Labor |
| wo_additional_info__1 | WO Additional Info | long_text | Service and Labor |
| check1__1 | Voided | checkbox | Completion |
| text_104__1 | Closed Out By | text | Completion |
| closed_out_date__1 | Closed Out Date | date | Completion |
| numeric_mkpvvmd4 | Miles | numbers | Service and Labor |
| text_mkpvevjt | WO Additional Info | text | Service and Labor |

## Review acceptance

All 95 active-board and 97 completed-board source columns are covered. Their existence/types are verified; section placement, ambiguous meanings, part billing and duplicate reconciliation await Kent's review. Do not treat this document's recommendations as requirements. After answers, update requirements.md, screens.md and decisions.md consistently, then proceed to wireframes before application code.

