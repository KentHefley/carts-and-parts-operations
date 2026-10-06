# Monday board field verification

Read-only metadata inspection on October 5, 2026 through the connected Monday app. Scope: the five boards Kent identified. No item/customer records, file bytes, historical boards, automations, or Monday data were changed or imported. Column existence/types/options are verified; business meaning and proposed app mappings still need review. Monday types are source types, not approved application types.

## Findings requiring decisions

- Sales Orders has 95 top-level columns; Complete Sales Orders has 97. Both schemas, including duplicate labels, are preserved below with IDs. Do not map by title or matching column ID alone across boards: Date Entered/Scheduled Job Date IDs differ, and some identical IDs have different meanings.
- Job Type includes Maint/Service, not an exact Service label. Confirm which values automatically open Service and Labor. Complete Sales Orders also has additional legacy job types.
- Freight-Shipping is a dropdown, while Freight is a separate text column. The completed board's shipping dropdown contains many amount-like labels and an invalid-looking `19..47` value. Do not interpret labels as approved numeric charges or discard historical values.
- AM Description is a text column on both boards. Kent subsequently confirmed it is manual text in the labor inputs and is unsure what the abbreviation means; this supersedes the earlier AM/time interpretation. Preserve it as text. Time In and Time Out are separate hour columns.
- Both boards contain Hours Worked formulas with different expressions. Kent confirmed Hours Worked automatically calculates from Time In/Out, while Labor Price and Travel Price are manually entered. Sales Orders treats equal Time In/Out as the overnight branch (24 hours); do not adopt this edge behavior without confirmation. Hours Worked is not payroll or a labor-price formula.
- Preserve Multiple Day Hours, # Of Techs, cart/service counts, In House Refurbs, separate Freight, specialized quantities/prices, four additional part groups, WO Additional Info, Voided checkbox, Closed Out By, and Closed Out Date. Their exact meaning, sections, copy resets, calculation participation, and relation to completion metadata remain undefined.
- Complete Sales Orders contains two Miles columns and two WO Additional Info columns (text and long_text). Reconciliation is unresolved; never silently merge or drop either source value.
- Complete Sales Orders has duplicate Pending status labels and no Expedite label in its status settings. The agreed application uses the five canonical statuses; preserve legacy label identities for any future migration, which is not authorized now.
- No top-level column named Order Total, Completed By, Voided By, Voided Date, or Void Reason was returned. These remain application requirements, not verified existing columns. Closed Out By/Date must not be assumed equivalent to Completed By/Completion Date.
- Subitems expose Name, Owner, Status, Date. They are not confirmed to be order item rows. The agreed item quantity/description/unit-price records remain separate from an unreviewed subitem workflow.
- Price Books has Name and Books (file). File records were not read, so Yellow/Blue/White contents and current versions are not verified.
- Calendar has Name, Person, Status, Start Date, Notes and Subitems. No explicit end date/time zone/recurrence columns were returned; these are planned requirements, not verified existing metadata.
- Time Off/Birthday Calender has category-like status values alongside generic task statuses and multiple date columns. Map Anniversary to Work Anniversary only through explicit review. No employee item data was read.

## Confirmed mappings from prior requirements

Sales Order Auto # maps to SO Number; Salesman to Salesperson; Forward to to Assigned To; the three Quantity/Item Description/Price groups to repeatable order item records; Additional Info to Additional Information with SO Additional Info in email. These use the agreed semantics. Remaining field mappings below are preservation candidates, not approval to introduce new rules. Fixed email inclusion remains in field-inventory.md; newly discovered columns do not expand it.

## Sales Orders

Source: [Sales Orders](https://cartsandparts.monday.com/boards/6554539589). 95 top-level columns.

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| subitems__1 | Subitems | subtasks |
| text8__1 | Sales Order Auto # | text |
| status__1 | Status | status |
| date_entered0__1 | Date Entered | date |
| division__1 | Division | dropdown |
| item_id__1 | Item ID | item_id |
| text_28__1 | Purchase Order | text |
| start_job_date__1 | Scheduled Job Date | date |
| date__1 | Completion Date | date |
| dup__of_text3__1 | Salesman | text |
| dropdown__1 | Job Type | dropdown |
| priority__1 | Priority | dropdown |
| terms__1 | Terms | dropdown |
| text_12__1 | NTE | text |
| dup__of_priority__1 | Price Level | dropdown |
| freight__1 | Freight-Shipping | dropdown |
| numbers__1 | Miles | numbers |
| text_13__1 | Invoice To | text |
| text_16__1 | Inv Address | text |
| text_17__1 | Inv City | text |
| text_18__1 | Inv State | text |
| text_19__1 | Inv Zip | text |
| text_15__1 | Inv Contact Name | text |
| text71__1 | Invoice Phone | text |
| text_21__1 | Store Name | text |
| text_22__1 | Store Number | text |
| text_24__1 | Store Address | text |
| text_25__1 | Store City | text |
| text_26__1 | Store State | text |
| text_27__1 | Store Zip | text |
| text_23__1 | Store Contact | text |
| text_30__1 | Store Phone | text |
| text_31__1 | Email Address | text |
| text_32__1 | Description of Service | text |
| text_38__1 | Item Description 1 | text |
| text_33__1 | Quantity One | text |
| text_44__1 | Price 1 | text |
| text_40__1 | Item Description 2 | text |
| text_34__1 | Quantity Two | text |
| text_45__1 | Price2 | text |
| text_41__1 | Item Description 3 | text |
| text_35__1 | Quantity Three | text |
| text_46__1 | Price 3 | text |
| text81__1 | Labor Description | text |
| text06__1 | Labor Price | text |
| text32__1 | Travel Description | text |
| text0__1 | Travel Price | text |
| text14__1 | AM Description | text |
| additional_info__1 | Additional Info | long_text |
| text_51__1 | Submitted By | text |
| people__1 | Forward to | people |
| button__1 | Send SO Email | button |
| text7__1 | Tech 1 | text |
| text9__1 | Tech 2 | text |
| hour__1 | Time In | hour |
| hour6__1 | Time Out | hour |
| formula__1 | Hours Worked | formula |
| text61__1 | Multiple Day Hours | text |
| text322__1 | # Of Techs | text |
| total_shopping_cart__1 | Total Shopping Cart | numbers |
| total_backroom__1 | Total Backroom | numbers |
| total_ada__1 | Total ADA | numbers |
| __scrapped__1 | # Scrapped | numbers |
| __repaired__1 | # Repaired | numbers |
| __cleaned__1 | # Cleaned | numbers |
| __unavailable__1 | # Unavailable | numbers |
| text5__1 | In House Refurbs | text |
| text772__1 | Freight | text |
| text_65__1 | WH515PO QTY | text |
| text6__1 | Price | text |
| text_66__1 | CC5SW QTY | text |
| text92__1 | Price | text |
| text_69__1 | Leg Hole Closure QTY | text |
| text_67__1 | Price | text |
| text_68__1 | Seat Belt QTY | text |
| text87__1 | Price | text |
| text_70__1 | HDL QTY | text |
| text_71__1 | Price | text |
| text85__1 | Part Description 1 | text |
| text39__1 | QTY | text |
| text70__1 | Price | text |
| text75__1 | Part Description 2 | text |
| text72__1 | QTY | text |
| text50__1 | Price | text |
| text79__1 | Part Description 3 | text |
| text03__1 | QTY | text |
| text01__1 | Price | text |
| text4__1 | Part Description 4 | text |
| text40__1 | QTY | text |
| text84__1 | Price | text |
| text_78__1 | WO Additional Info | text |
| check1__1 | Voided | checkbox |
| text_79__1 | Closed Out By | text |
| closed_out_date4__1 | Closed Out Date | date |

### Choice settings

**Status (status__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 0 | In Progress | false |
| 1 | Complete | false |
| 2 | Expedite | false |
| 3 | Voided | false |
| 5 | Pending | false |

**Division (division__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | Oklahoma City | false |
| 2 | San Antonio | false |
| 3 | Houston | false |
| 4 | DFW | false |
| 5 | PHX | false |
| 6 | Cleveland | false |
| 7 | Tampa | false |
| 8 | Las Vegas | false |
| 9 | Corporate | false |

**Job Type (dropdown__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | CartWipes | false |
| 2 | CartWorks | false |
| 3 | Maint/Service | false |
| 4 | Used Carts | false |
| 5 | Hand Baskets | false |
| 6 | Parts | false |
| 7 | Other | false |
| 8 | Unarco | false |
| 9 | CNP | false |
| 10 | Online Order | false |

**Priority (priority__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | standard | true |
| 2 | Standard | false |
| 3 | Important | false |
| 4 | New Store | false |

**Terms (terms__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | Net 30 | false |
| 2 | Credit Card | false |
| 3 | No Charge | false |
| 4 | COD | false |

**Price Level (dup__of_priority__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 4 | Yellow | false |
| 5 | White | false |
| 6 | Blue | false |
| 7 | Contracted | false |

**Freight-Shipping (freight__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | NA | false |
| 2 | Prepaid +Add | false |
| 3 | CPU | false |
| 4 | FOB Delivered | false |
| 5 | Freight Collect | false |

### Hours Worked source formula

Column ID: formula__1. Preserved for comparison; not approved implementation logic.

```text
IF(
  AND({hour__1}, {hour6__1}),
  IF(
    TIMEVALUE("1/1/1 " & {hour6__1}) > TIMEVALUE("1/1/1 " & {hour__1}),
    ROUND((TIMEVALUE("1/1/1 " & {hour6__1}) - TIMEVALUE("1/1/1 " & {hour__1})) * 24, 2),
    ROUND((1 - (TIMEVALUE("1/1/1 " & {hour__1}) - TIMEVALUE("1/1/1 " & {hour6__1}))) * 24, 2)
  ),
  ""
)
```

### Subitem columns

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| person | Owner | people |
| status | Status | status |
| date0 | Date | date |

## Complete Sales Orders

Source: [Complete Sales Orders](https://cartsandparts.monday.com/boards/6612672396). 97 top-level columns.

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| subitems__1 | Subitems | subtasks |
| text8__1 | Sales Order Auto # | text |
| status__1 | Status | status |
| date3__1 | Date Entered | date |
| division__1 | Division | dropdown |
| item_id__1 | Item ID | item_id |
| text_28__1 | Purchase Order | text |
| date_entered0__1 | Scheduled Job Date | date |
| completed_date__1 | Completion Date | date |
| dup__of_text3__1 | Salesman | text |
| job_type__1 | Job Type | dropdown |
| priority__1 | Priority | dropdown |
| terms__1 | Terms | dropdown |
| text_12__1 | NTE | text |
| dup__of_priority__1 | Price Level | dropdown |
| freight__1 | Freight-Shipping | dropdown |
| numeric_mm656szg | Miles | numbers |
| text_13__1 | Invoice To | text |
| text_16__1 | Inv Address | text |
| text_17__1 | Inv City | text |
| text_18__1 | Inv State | text |
| text_19__1 | Inv Zip | text |
| text_15__1 | Inv Contact Name | text |
| text__1 | Invoice Phone | text |
| text_21__1 | Store Name | text |
| text_22__1 | Store Number | text |
| text_24__1 | Store Address | text |
| text_25__1 | Store City | text |
| text_26__1 | Store State | text |
| text_27__1 | Store Zip | text |
| text_23__1 | Store Contact | text |
| text_30__1 | Store Phone | text |
| text_31__1 | Email Address | text |
| text_32__1 | Description of Service | text |
| text_38__1 | Item Description 1 | text |
| text_33__1 | Quantity One | text |
| text_44__1 | Price 1 | text |
| text_40__1 | Item Description 2 | text |
| text_34__1 | Quantity Two | text |
| text_45__1 | Price2 | text |
| text_41__1 | Item Description 3 | text |
| text_35__1 | Quantity Three | text |
| text_46__1 | Price 3 | text |
| text80__1 | Labor Description | text |
| text_78__1 | Labor Price | text |
| text0__1 | Travel Description | text |
| text3__1 | Travel Price | text |
| text03__1 | AM Description | text |
| additional_info__1 | Additional Info | long_text |
| text_51__1 | Submitted By | text |
| people__1 | Forward to | people |
| button__1 | Send SO Email | button |
| text_52__1 | Tech 1 | text |
| text37__1 | Tech 2 | text |
| hour9__1 | Time In | hour |
| hour8__1 | Time Out | hour |
| formula__1 | Hours Worked | formula |
| text2__1 | Multiple Day Hours | text |
| text21__1 | # Of Techs | text |
| total_shopping_cart__1 | Total Shopping Cart | numbers |
| total_backroom__1 | Total Backroom | numbers |
| total_ada__1 | Total ADA | numbers |
| __scrapped__1 | # Scrapped | numbers |
| __repaired__1 | # Repaired | numbers |
| __cleaned__1 | # Cleaned | numbers |
| __unavailable__1 | # Unavailable | numbers |
| text_79__1 | In House Refurbs | text |
| text034__1 | Freight | text |
| text_66__1 | WH515PO QTY | text |
| text_65__1 | Price | text |
| text_68__1 | CC5SW QTY | text |
| text_67__1 | Price | text |
| text_70__1 | Leg Hole Closure QTY | text |
| text_69__1 | Price | text |
| text_72__1 | Seat Belt QTY | text |
| text_71__1 | Price | text |
| text_74__1 | HDL QTY | text |
| text_73__1 | Price | text |
| text_53__1 | Part Description 1 | text |
| text_57__1 | QTY | text |
| text_58__1 | Price | text |
| text_75__1 | Part Description 2 | text |
| text_76__1 | QTY | text |
| text_77__1 | Price | text |
| text_80__1 | Part Description 3 | text |
| text_82__1 | QTY | text |
| text6__1 | Price | text |
| text_83__1 | Part Description 4 | text |
| text_84__1 | QTY | text |
| text_81__1 | Price | text |
| wo_additional_info__1 | WO Additional Info | long_text |
| check1__1 | Voided | checkbox |
| text_104__1 | Closed Out By | text |
| closed_out_date__1 | Closed Out Date | date |
| numeric_mkpvvmd4 | Miles | numbers |
| text_mkpvevjt | WO Additional Info | text |

### Choice settings

**Status (status__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 0 | In Progress | false |
| 1 | Complete | false |
| 2 | Voided | false |
| 3 | Pending | false |
| 5 | Pending | false |

**Division (division__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | Oklahoma City | false |
| 2 | San Antonio | false |
| 3 | Houston | false |
| 4 | DFW | false |
| 5 | PHX | false |
| 6 | Cleveland | false |
| 7 | Tampa | false |
| 8 | Las Vegas | false |
| 9 | Corporate | false |

**Job Type (job_type__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 15 | CNP | false |
| 14 | Online Order | false |
| 13 | Unarco | false |
| 12 | Other | false |
| 11 | Used Carts | false |
| 10 | Maint/Service | false |
| 1 | Maintenance | false |
| 2 | Parts | false |
| 3 | Partial Maintenance | false |
| 4 | ADA | false |
| 5 | Used | false |
| 6 | CartWipes | false |
| 7 | CartWorks | false |
| 8 | Hand Baskets | false |
| 9 | scrap carts | false |

**Priority (priority__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | standard | true |
| 2 | Standard | false |
| 3 | Important | false |
| 4 | New Store | false |

**Terms (terms__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | Net 30 | false |
| 2 | Credit Card | false |
| 3 | No Charge | false |
| 4 | COD | false |

**Price Level (dup__of_priority__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 4 | Yellow | false |
| 5 | White | false |
| 6 | Blue | false |
| 7 | Contracted | false |

**Freight-Shipping (freight__1)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 1 | NA | false |
| 2 | Prepaid +Add | false |
| 3 | CPU | false |
| 4 | FOB Delivered | false |
| 5 | Freight Collect | false |
| 6 | 61.94 | false |
| 7 | 193.14 | false |
| 8 | 41.56 | false |
| 9 | 101.56 | false |
| 10 | 19.99 | false |
| 11 | 20.58 | false |
| 12 | 17.50 | false |
| 13 | 19.10 | false |
| 14 | 26.35 | false |
| 15 | 17.89 | false |
| 16 | 24.65 | false |
| 17 | 18.55 | false |
| 18 | 25.71 | false |
| 19 | 18.71 | false |
| 20 | 22.57 | false |
| 21 | 77.56 | false |
| 22 | 69.61 | false |
| 23 | 67.62 | false |
| 24 | 39.14 | false |
| 25 | 32.52 | false |
| 26 | 53.78 | false |
| 27 | 48.36 | false |
| 28 | 22.16 | false |
| 29 | 19.47 | false |
| 30 | 20.57 | false |
| 31 | 54.23 | false |
| 32 | 24.95 | false |
| 33 | 17.91 | false |
| 34 | 44.96 | false |
| 35 | 24.37 | false |
| 36 | 26.57 | false |
| 37 | 91.86 | false |
| 38 | 21.66 | false |
| 39 | 450.00 | false |
| 40 | 66.44 | false |
| 41 | 29.42 | false |
| 42 | 25.83 | false |
| 43 | 26.24 | false |
| 44 | 193.96 | false |
| 45 | 25.53 | false |
| 46 | 24.43 | false |
| 47 | 25.02 | false |
| 48 | 20.87 | false |
| 49 | 24.17 | false |
| 50 | 24.22 | false |
| 51 | 22.46 | false |
| 52 | 19..47 | false |
| 53 | 23.02 | false |
| 54 | 25.74 | false |
| 55 | 276.49 | false |
| 56 | 20.96 | false |
| 57 | 20.07 | false |
| 58 | 19.55 | false |
| 59 | 20.65 | false |
| 60 | 23.77 | false |
| 61 | 17.99 | false |
| 62 | 19.19 | false |
| 63 | 22.97 | false |
| 64 | 18.79 | false |
| 65 | 21.07 | false |
| 66 | 23.92 | false |
| 67 | 24.07 | false |
| 68 | 25.05 | false |
| 69 | 17.29 | false |
| 70 | 24.33 | false |
| 71 | 20.67 | false |
| 72 | 25.13 | false |
| 73 | 23.12 | false |
| 74 | 20.01 | false |
| 75 | 27.30 | false |
| 76 | 21.65 | false |
| 77 | 17.96 | false |
| 78 | 26.41 | false |
| 79 | 18.63 | false |
| 80 | 16.78 | false |
| 81 | 22.25 | false |
| 82 | 23.71 | false |
| 83 | 22.22 | false |
| 84 | 24.11 | false |
| 85 | 20.92 | false |
| 86 | 20.03 | false |
| 87 | 19.14 | false |
| 88 | 17.95 | false |
| 89 | 18.90 | false |
| 90 | 23.72 | false |
| 91 | 20.61 | false |
| 92 | 21.60 | false |
| 93 | 20.82 | false |
| 94 | 17.93 | false |
| 95 | 19.51 | false |
| 96 | 25.00 | false |
| 97 | 350.00 | false |
| 98 | 25.08 | false |
| 99 | 30.69 | false |
| 100 | 18.75 | false |
| 101 | 21.61 | false |
| 102 | 25.58 | false |
| 103 | 24.48 | false |
| 104 | 16.64 | false |
| 105 | 21.71 | false |
| 106 | 24.28 | false |
| 107 | 24.02 | false |
| 108 | 185.63 | false |
| 109 | 22.92 | false |
| 110 | 19.97 | false |
| 111 | 25.89 | false |
| 112 | 26.36 | false |
| 113 | 27.25 | false |
| 114 | 20.62 | false |
| 115 | 20.30 | false |
| 116 | 17.25 | false |
| 117 | 17.54 | false |
| 118 | 25.47 | false |
| 119 | 23.56 | false |
| 120 | 30.70 | false |
| 121 | 17.63 | false |
| 122 | 22.21 | false |
| 123 | 26.94 | false |
| 124 | 20.05 | false |
| 125 | 25.79 | false |
| 126 | 22.60 | false |
| 127 | 22.90 | false |
| 128 | 22.51 | false |
| 129 | 23.87 | false |
| 130 | 25.84 | false |
| 131 | 66.18 | false |
| 132 | 25.38 | false |
| 133 | 119.60 | false |
| 134 | 23.39 | false |
| 135 | 42.98 | false |
| 136 | 107.86 | false |
| 137 | 36.52 | false |
| 138 | 168.24 | false |
| 139 | 18.94 | false |
| 140 | 138.02 | false |
| 141 | 78.59 | false |
| 142 | 24.30 | false |
| 143 | 25.43 | false |
| 144 | 17.57 | false |
| 145 | 17.67 | false |
| 146 | 25.95 | false |
| 147 | 16.50 | false |
| 148 | 18.59 | false |
| 149 | 27.35 | false |
| 150 | 54.93 | false |
| 151 | 81.94 | false |
| 152 | 21.56 | false |
| 153 | 24.89 | false |
| 154 | 17.22 | false |
| 155 | 25.41 | false |
| 156 | 22.91 | false |
| 157 | 20.78 | false |
| 158 | 27.87 | false |
| 159 | 22.36 | false |
| 160 | 18.81 | false |
| 161 | 24.06 | false |
| 162 | 38.52 | false |
| 163 | 26.30 | false |
| 164 | 20.98 | false |
| 165 | 47.12 | false |
| 166 | 23.81 | false |
| 167 | 32.98 | false |
| 168 | 107.20 | false |
| 169 | 20.28 | false |
| 170 | 25.78 | false |
| 171 | 28.76 | false |
| 172 | 18.35 | false |
| 173 | 23.51 | false |
| 174 | 19.41 | false |
| 175 | 26.52 | false |
| 176 | 23.91 | false |
| 177 | 26.81 | false |
| 178 | 26.88 | false |
| 179 | 22.55 | false |
| 180 | 22.85 | false |
| 181 | 75.19 | false |
| 182 | 86.31 | false |
| 183 | 118.16 | false |
| 184 | 40.97 | false |
| 185 | 78.26 | false |
| 186 | 78.16 | false |
| 187 | 430.75 | false |
| 188 | 81.84 | false |
| 189 | 114.41 | false |
| 190 | 56.81 | false |
| 191 | 20.16 | false |
| 192 | 19.27 | false |
| 193 | 26.80 | false |
| 194 | ABF Freight | false |
| 195 | 21.75 | false |
| 196 | 21.05 | false |
| 197 | 38.30 | false |
| 198 | 18.06 | false |
| 199 | 20.75 | false |
| 200 | 22.35 | false |
| 201 | 23.06 | false |
| 202 | 25.16 | false |
| 203 | 65.23 | false |
| 204 | 39.37 | false |
| 205 | 23.44 | false |
| 206 | 21.74 | false |
| 207 | 21.82 | false |
| 208 | 129.90 | false |
| 209 | 60.78 | false |
| 210 | 24.64 | false |
| 211 | 33.35 | false |
| 212 | 99.32 | false |
| 213 | 75.26 | false |
| 214 | 21.92 | false |
| 215 | 78.06 | false |
| 216 | 167.36 | false |
| 217 | 650.00 | false |
| 218 | 20.35 | false |
| 219 | 178.82 | false |
| 220 | 67.66 | false |
| 221 | 83.68 | false |
| 222 | 20.41 | false |
| 223 | 258.00 | false |
| 224 | 79.92 | false |
| 225 | 22.02 | false |
| 226 | 45.59 | false |
| 227 | 49.01 | false |
| 228 | 21.22 | false |
| 229 | 18.29 | false |
| 230 | 220.80 | false |
| 231 | 23.35 | false |
| 232 | 36.90 | false |
| 233 | 185.10 | false |
| 234 | 486.71 | false |
| 235 | 27.14 | false |
| 236 | 24.41 | false |
| 237 | 121.98 | false |
| 238 | 65.63 | false |
| 239 | 61.73 | false |
| 240 | 22.63 | false |
| 241 | 51.62 | false |
| 242 | 232.44 | false |
| 243 | 40.80 | false |
| 244 | 18.27 | false |
| 245 | 21.42 | false |
| 246 | 22.10 | false |
| 247 | 27.69 | false |
| 248 | 19.88 | false |
| 249 | 45.27 | false |
| 250 | 26.86 | false |
| 251 | 27.41 | false |
| 252 | 37.20 | false |
| 253 | 24.03 | false |
| 254 | 149.08 | false |
| 255 | 23.33 | false |
| 256 | 32.20 | false |
| 257 | 25.42 | false |
| 258 | 20.37 | false |
| 259 | 25.76 | false |
| 260 | 20.76 | false |
| 261 | 282.62 | false |
| 262 | 21.97 | false |
| 263 | 22.96 | false |
| 264 | 29.13 | false |
| 265 | 19.37 | false |
| 266 | 19.22 | false |
| 267 | 300.00 | false |
| 268 | 42.33 | false |
| 269 | 45.29 | false |
| 270 | 19.26 | false |
| 271 | 47.62 | false |
| 272 | 45.53 | false |
| 273 | 72.96 | false |
| 274 | 218.87 | false |
| 275 | 41.41 | false |
| 276 | 19.11 | false |
| 277 | 27.45 | false |
| 278 | 21.00 | false |
| 279 | 21.09 | false |
| 280 | 28.47 | false |
| 281 | 25.81 | false |
| 282 | 61.54 | false |
| 283 | 24.72 | false |
| 284 | 84.48 | false |
| 285 | 29.17 | false |
| 286 | 28.57 | false |
| 287 | 86.07 | false |
| 288 | 58.73 | false |
| 289 | 24.32 | false |
| 290 | 20.86 | false |
| 291 | 43.40 | false |
| 292 | 21.30 | false |
| 293 | 95.01 | false |
| 294 | 27.08 | false |
| 295 | 26.06 | false |
| 296 | 26.01 | false |
| 297 | 69.46 | false |
| 298 | 47.84 | false |
| 299 | 850.00 | false |
| 300 | 700.00 | false |
| 301 | 223.96 | false |
| 302 | 50.67 | false |
| 303 | 48.42 | false |
| 304 | 265.44 | false |
| 305 | 21.18 | false |
| 306 | 23.30 | false |
| 307 | 18.25 | false |
| 308 | 33.09 | false |
| 309 | 23.28 | false |
| 310 | 246.99 | false |
| 311 | 42.47 | false |
| 312 | 22.79 | false |
| 313 | 148.76 | false |
| 314 | 41.66 | false |
| 315 | 20.31 | false |
| 316 | 93.14 | false |
| 317 | 26.96 | false |
| 318 | 18.19 | false |
| 319 | 21.36 | false |
| 320 | 26.75 | false |
| 321 | 134.20 | false |
| 322 | 67.22 | false |
| 323 | 47.35 | false |
| 324 | 17.74 | false |
| 325 | 17.49 | false |
| 326 | 18.61 | false |
| 327 | 41.26 | false |
| 328 | 22.70 | false |
| 329 | 23.38 | false |
| 330 | 19.34 | false |
| 331 | 17.60 | false |
| 332 | 20.79 | false |
| 333 | 22.80 | false |
| 334 | uhaul frieght discuss with Marc to deliver 40 large carts and 15 2 tier | false |
| 335 | 47.52 | false |
| 336 | 22.39 | false |
| 337 | 19.45 | false |
| 338 | 19.90 | false |
| 339 | 21.51 | false |
| 340 | 64.71 | false |
| 341 | 17.86 | false |
| 342 | 18.65 | false |
| 343 | 67.04 | false |
| 344 | 92.26 | false |
| 345 | 18.73 | false |
| 346 | 16.74 | false |
| 347 | 17.59 | false |
| 348 | 201.32 | false |
| 349 | 61.68 | false |
| 350 | 43.46 | false |
| 351 | 102.08 | false |
| 352 | 25.11 | false |
| 353 | 26.28 | false |
| 354 | 19.21 | false |
| 355 | 17.58 | false |
| 356 | 20.46 | false |
| 357 | 24.52 | false |
| 358 | 18.33 | false |
| 359 | 20.39 | false |
| 360 | 24.46 | false |
| 361 | 19.15 | false |
| 362 | 34.83 | false |
| 363 | 23.45 | false |
| 364 | 22.17 | false |
| 365 | 26.50 | false |
| 366 | 36.99 | false |
| 367 | 17.62 | false |
| 368 | 26.12 | false |
| 369 | 18.21 | false |
| 370 | 27.51 | false |
| 371 | 22.68 | false |
| 372 | 24.62 | false |
| 373 | 21.32 | false |
| 374 | 27.18 | false |
| 375 | 21.02 | false |
| 376 | 41.84 | false |
| 377 | 34.87 | false |
| 378 | 19.07 | false |
| 379 | 22.05 | false |
| 380 | 22.38 | false |
| 381 | 22.58 | false |
| 382 | 97.08 | false |
| 383 | 22.49 | false |
| 384 | 20.97 | false |
| 385 | 26.38 | false |
| 386 | 26.83 | false |
| 387 | 19.18 | false |
| 388 | 19.30 | false |
| 389 | 30.30 | false |
| 390 | 38.32 | false |
| 391 | 22.07 | false |
| 392 | 28.85 | false |
| 393 | 28.56 | false |
| 394 | 21.39 | false |
| 395 | 50.32 | false |
| 396 | 163.45 | false |
| 397 | 28.45 | false |
| 398 | 21.57 | false |
| 399 | 22.64 | false |
| 400 | 23.49 | false |
| 401 | 23.90 | false |
| 402 | 45.79 | false |
| 403 | 24.73 | false |
| 404 | 89.75 | false |
| 405 | 18.00 | false |
| 406 | 22.52 | false |
| 407 | 67.88 | false |
| 408 | 60.00 | false |
| 409 | 23.26 | false |
| 410 | 24.71 | false |
| 411 | 20.44 | false |
| 412 | 27.00 | false |
| 413 | 24.40 | false |
| 414 | 28.92 | false |
| 415 | 162.51 | false |
| 416 | 26.18 | false |
| 417 | 18.98 | false |
| 418 | 27.62 | false |
| 419 | 29.85 | false |
| 420 | 618.48 | false |
| 421 | 19.42 | false |
| 422 | 20.71 | false |
| 423 | 18.97 | false |
| 424 | 29.66 | false |
| 425 | 24.67 | false |
| 426 | 55.24 | false |
| 427 | 24.13 | false |
| 428 | 25.51 | false |
| 429 | 28.93 | false |
| 430 | 22.19 | false |
| 431 | 18.67 | false |
| 432 | 155.74 | false |
| 433 | 25.20 | false |
| 434 | 26.14 | false |
| 435 | 45.54 | false |
| 436 | uhaul rental 232.53 | false |
| 437 | 24.50 | false |
| 438 | 27.89 | false |
| 439 | 17.09 | false |
| 440 | 27.59 | false |
| 441 | 24.23 | false |
| 442 | 25.87 | false |
| 443 | 22.69 | false |
| 444 | 33.60 | false |
| 445 | 23.20 | false |
| 446 | 27.06 | false |
| 447 | 26.70 | false |
| 448 | 20.55 | false |
| 449 | 28.02 | false |
| 450 | 20.33 | false |
| 451 | 160.78 | false |
| 452 | 64.86 | false |
| 453 | 30.05 | false |
| 454 | 22.72 | false |
| 455 | 36.20 | false |
| 456 | 32.57 | false |
| 457 | 250.79 | false |
| 458 | 37.78 | false |
| 459 | 219.44 | false |
| 460 | 19.50 | false |
| 461 | 24.01 | false |
| 462 | 29.69 | false |
| 463 | 24.96 | false |
| 464 | 21.10 | false |
| 465 | 27.12 | false |
| 466 | 29.28 | false |
| 467 | 278.65 | false |
| 468 | 31.09 | false |
| 469 | 90.72 | false |
| 470 | 61.60 | false |
| 471 | 19.38 | false |
| 472 | 28.18 | false |
| 473 | 28.70 | false |
| 474 | 29.04 | false |
| 475 | 20.53 | false |
| 476 | 24.21 | false |
| 477 | 94.14 | false |
| 478 | 23.17 | false |
| 479 | 44.00 | false |
| 480 | 24.81 | false |
| 481 | 25.66 | false |
| 482 | 41.29 | false |
| 483 | 22.34 | false |
| 484 | 21.70 | false |
| 485 | 24.39 | false |
| 486 | 23.40 | false |
| 487 | 24.86 | false |
| 488 | 30.24 | false |
| 489 | 27.17 | false |
| 490 | 25.17 | false |
| 491 | 41.80 | false |
| 492 | 32.82 | false |
| 493 | 116.06 | false |
| 494 | 132.72 | false |
| 495 | 51.73 | false |
| 496 | 45.04 | false |
| 497 | 28.08 | false |
| 498 | 22.45 | false |
| 499 | 28.72 | false |
| 500 | 21.31 | false |
| 501 | 23.08 | false |
| 502 | 24.84 | false |
| 503 | 24.10 | false |
| 504 | 28.06 | false |
| 505 | 24.85 | false |
| 506 | 120.66 | false |
| 507 | 89.78 | false |
| 508 | 20.13 | false |
| 509 | 19.48 | false |
| 510 | 22.50 | false |
| 511 | 31.45 | false |
| 512 | 248.28 | false |
| 513 | 28.17 | false |
| 514 | 80.82 | false |
| 515 | 20.26 | false |
| 516 | 23.63 | false |
| 517 | 33.50 | false |
| 518 | 83.13 | false |
| 519 | 16.13 | false |
| 520 | 28.31 | false |
| 521 | 19.63 | false |
| 522 | 21.50 | false |
| 523 | 28.40 | false |
| 524 | 23.69 | false |
| 525 | 30.58 | false |
| 526 | 20.50 | false |
| 527 | 50.86 | false |
| 528 | 27.27 | false |
| 529 | 62.28 | false |
| 530 | 30.10 | false |
| 531 | 30.77 | false |
| 532 | 19.75 | false |
| 533 | 47.79 | false |
| 534 | 29.23 | false |
| 535 | 162.45 | false |
| 536 | 29.01 | false |
| 537 | 22.77 | false |
| 538 | 77.86 | false |
| 539 | 27.53 | false |
| 540 | 24.93 | false |
| 541 | 29.07 | false |
| 542 | 23.22 | false |
| 543 | 27.66 | false |
| 544 | 21.78 | false |
| 545 | 20.29 | false |
| 546 | 25.98 | false |
| 547 | 23.36 | false |
| 548 | 34.53 | false |
| 549 | 154.08 | false |
| 550 | 26.07 | false |
| 551 | 51.36 | false |
| 552 | 146.90 | false |
| 553 | 196.64 | false |
| 554 | 80.97 | false |
| 555 | 38.65 | false |
| 556 | 31.95 | false |
| 557 | 24.60 | false |
| 558 | 35.37 | false |
| 559 | 25.52 | false |
| 560 | 27.98 | false |
| 561 | 23.95 | false |
| 562 | 172.10 | false |
| 563 | 24.56 | false |
| 564 | 28.51 | false |
| 565 | 29.93 | false |
| 566 | 27.40 | false |
| 567 | 38.15 | false |
| 568 | 23.86 | false |
| 569 | 22.73 | false |
| 570 | 20.09 | false |
| 571 | 28.87 | false |
| 572 | 189.15 | false |
| 573 | 24.59 | false |
| 574 | 24.66 | false |
| 575 | 33.40 | false |
| 576 | 240.25 | false |
| 577 | 29.02 | false |
| 578 | 30.46 | false |
| 579 | 177.64 | false |
| 580 | 192.70 | false |
| 581 | 177.46 | false |
| 582 | 178.98 | false |
| 583 | 50.77 | false |
| 584 | 24.36 | false |
| 585 | 23.59 | false |
| 586 | 26.03 | false |
| 587 | 25.90 | false |
| 588 | 22.59 | false |
| 589 | 178.27 | false |
| 590 | 191.94 | false |
| 591 | 32.36 | false |
| 592 | 19.56 | false |
| 593 | 29.86 | false |
| 594 | 20.21 | false |
| 595 | 52.00 | false |
| 596 | 53.51 | false |
| 597 | 23.50 | false |
| 598 | 24.27 | false |
| 599 | 97.83 | false |
| 600 | 158.26 | false |
| 601 | 253.64 | false |
| 602 | 54.30 | false |
| 603 | 31.47 | false |
| 604 | 34.45 | false |
| 605 | 27.28 | false |
| 606 | 286.70 | false |
| 607 | 710.14 | false |
| 608 | 28.23 | false |
| 609 | 23.52 | false |
| 610 | 22.41 | false |
| 611 | 858.00 | false |
| 612 | 21.25 | false |
| 613 | 26.90 | false |
| 614 | 29.56 | false |
| 615 | 216.40 | false |
| 616 | 31.11 | false |
| 617 | 50.42 | false |
| 618 | 157.68 | false |
| 619 | 31.07 | false |
| 620 | 39.11 | false |
| 621 | 22.99 | false |
| 622 | 24.20 | false |
| 623 | 22.33 | false |
| 624 | 29.46 | false |
| 625 | 45.60 | false |
| 626 | 28.54 | false |
| 627 | 28.88 | false |
| 628 | 26.73 | false |
| 629 | 35.36 | false |
| 630 | 24.90 | false |
| 631 | 19.94 | false |
| 632 | 22.28 | false |
| 633 | 44.85 | false |
| 634 | 52.98 | false |
| 635 | 29.00 | false |
| 636 | 24.26 | false |
| 637 | 197.90 | false |
| 638 | 83.34 | false |
| 639 | 21.79 | false |
| 640 | 26.91 | false |
| 641 | 22.37 | false |
| 642 | 24.12 | false |
| 643 | 20.14 | false |
| 644 | 157.56 | false |
| 645 | 19.83 | false |
| 646 | 34.33 | false |
| 647 | 30.00 | false |
| 648 | 34.90 | false |
| 649 | 48.23 | false |
| 650 | 22.89 | false |
| 651 | 23.66 | false |
| 652 | 21.44 | false |
| 653 | 48.88 | false |
| 654 | 28.34 | false |
| 655 | 20.25 | false |
| 656 | 51.14 | false |
| 657 | 67.94 | false |
| 658 | 103.40 | false |
| 659 | 33.85 | false |
| 660 | 34.61 | false |
| 661 | 29.92 | false |
| 662 | 24.54 | false |
| 663 | 44.39 | false |
| 664 | 58.12 | false |
| 665 | 34.30 | false |
| 666 | 21.46 | false |
| 667 | 23.31 | false |
| 668 | 31.27 | false |
| 669 | 28.63 | false |
| 670 | 21.38 | false |
| 671 | 19.67 | false |
| 672 | 29.34 | false |
| 673 | 36.45 | false |
| 674 | 68.35 | false |
| 675 | 28.46 | false |
| 676 | 32.62 | false |
| 677 | 64.33 | false |
| 678 | 43.39 | false |
| 679 | 29.39 | false |
| 680 | 27.73 | false |
| 681 | 223.20 | false |
| 682 | 22.14 | false |
| 683 | 30.35 | false |
| 684 | 129.30 | false |
| 685 | 107.92 | false |
| 686 | 57.10 | false |
| 687 | 21.54 | false |
| 688 | 17.72 | false |
| 689 | 100.01 | false |
| 690 | 255.36 | false |
| 691 | 16.89 | false |
| 692 | 18.20 | false |
| 693 | 15.81 | false |
| 694 | 21.28 | false |
| 695 | 16.52 | false |
| 696 | 17.73 | false |
| 697 | 20.43 | false |
| 698 | 25.19 | false |
| 699 | 16.55 | false |
| 700 | 16.99 | false |
| 701 | 18.99 | false |
| 702 | 16.96 | false |
| 703 | 18.31 | false |
| 704 | 25.15 | false |
| 705 | 15.40 | false |
| 706 | 24.63 | false |
| 707 | 24.08 | false |
| 708 | 17.12 | false |
| 709 | 127.92 | false |
| 710 | 16.03 | false |
| 711 | 18.45 | false |
| 712 | 22.53 | false |
| 713 | 25.27 | false |
| 714 | 21.35 | false |
| 715 | 22.95 | false |
| 716 | 37.60 | false |
| 717 | 18.30 | false |
| 718 | 24.61 | false |
| 719 | 16.12 | false |
| 720 | 15.61 | false |
| 721 | 17.41 | false |

### Hours Worked source formula

Column ID: formula__1. Preserved for comparison; not approved implementation logic.

```text
IF(AND({hour8__1}, {hour9__1}), 
  IF({hour8__1}>{hour9__1},
    ROUND(TIMEVALUE("1/1/1 " & HOURS_DIFF(IF({hour8__1}>{hour9__1},{hour8__1},""), IF({hour8__1}>{hour9__1},{hour9__1},""))) * 24, 2),
    ROUND(TIMEVALUE("1/1/1 " & HOURS_DIFF(IF({hour8__1}<={hour9__1},"24:00",""), IF({hour8__1}<={hour9__1},{hour9__1},""))) * 24, 2) +
    ROUND(TIMEVALUE("1/1/1 " & HOURS_DIFF(IF({hour8__1}<={hour9__1},{hour8__1},""), IF({hour8__1}<={hour9__1},"0:00",""))) * 24, 2)
  )
,"")
```

### Subitem columns

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| person | Owner | people |
| status | Status | status |
| date0 | Date | date |

## Price Books

Source: [Price Books](https://cartsandparts.monday.com/boards/7091117952). 2 top-level columns.

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| files__1 | Books | file |

### Choice settings

No label settings returned.

## Calendar

Source: [Calendar](https://cartsandparts.monday.com/boards/6613012400). 6 top-level columns.

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| subitems__1 | Subitems | subtasks |
| person | Person | people |
| status | Status | status |
| date4 | Start Date | date |
| notes__1 | Notes | long_text |

### Choice settings

**Status (status)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 0 | (blank) | false |
| 1 | Done | false |
| 2 | Stuck | false |
| 3 | (blank) | false |

### Subitem columns

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| person | Owner | people |
| status | Status | status |
| date0 | Date | date |

## Time Off/Birthday Calender

Source: [Time Off/Birthday Calender](https://cartsandparts.monday.com/boards/6794781987). 8 top-level columns.

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| subitems__1 | Subitems | subtasks |
| person | Person | people |
| status | Status | status |
| date4 | Date | date |
| date_28__1 | Birthday Date | date |
| date_12__1 | Time Off Date | date |
| date_167__1 | Holiday | date |

### Choice settings

**Status (status)**

| Label ID | Exact value | Deactivated |
| --- | --- | --- |
| 0 | Working on it | false |
| 1 | Done | false |
| 2 | Stuck | false |
| 3 | (blank) | false |
| 4 | Birthday | false |
| 6 | Time Off | false |
| 7 | Holiday | false |
| 8 | Anniversary | false |

### Subitem columns

| Column ID | Exact source label | Monday type |
| --- | --- | --- |
| name | Name | name |
| person | Owner | people |
| status | Status | status |
| date0 | Date | date |
