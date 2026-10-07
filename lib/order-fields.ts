export type FieldDefinition = { key: string; label: string; section: string; type: string; options?: string[] };
export const orderFields: FieldDefinition[] = [
  {
    "key": "division__1",
    "label": "Division",
    "section": "Order Overview",
    "type": "select",
    "options": [
      "Oklahoma City",
      "Dallas/Fort Worth",
      "Houston",
      "San Antonio",
      "Phoenix",
      "Cleveland",
      "Corporate"
    ]
  },
  {
    "key": "text_28__1",
    "label": "Purchase Order",
    "section": "Order Overview",
    "type": "text"
  },
  {
    "key": "start_job_date__1",
    "label": "Scheduled Job Date",
    "section": "Order Overview",
    "type": "date"
  },
  {
    "key": "dup__of_text3__1",
    "label": "Salesman",
    "section": "Order Overview",
    "type": "text"
  },
  {
    "key": "dropdown__1",
    "label": "Job Type",
    "section": "Order Overview",
    "type": "select",
    "options": [
      "CartWipes",
      "CartWorks",
      "CNP",
      "Hand Baskets",
      "Online Order",
      "Parts",
      "Unarco",
      "Used Carts",
      "Other"
    ]
  },
  {
    "key": "priority__1",
    "label": "Priority",
    "section": "Order Overview",
    "type": "select",
    "options": ["Standard", "Important", "New Store"]
  },
  {
    "key": "terms__1",
    "label": "Terms",
    "section": "Items and Pricing",
    "type": "select",
    "options": [
      "COD",
      "Credit Card",
      "Net 30",
      "No Charge"
    ]
  },
  {
    "key": "text_12__1",
    "label": "NTE",
    "section": "Items and Pricing",
    "type": "text"
  },
  {
    "key": "dup__of_priority__1",
    "label": "Price Level",
    "section": "Items and Pricing",
    "type": "select",
    "options": ["Yellow", "White", "Blue", "Contracted"]
  },
  {
    "key": "freight__1",
    "label": "Freight-Shipping",
    "section": "Items and Pricing",
    "type": "select",
    "options": [
      "CPU",
      "FOB Delivered",
      "Freight Collect",
      "Prepaid + Add",
      "NA"
    ]
  },
  {
    "key": "numbers__1",
    "label": "Miles",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "text_13__1",
    "label": "Invoice To",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_16__1",
    "label": "Inv Address",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_17__1",
    "label": "Inv City",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_18__1",
    "label": "Inv State",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_19__1",
    "label": "Inv Zip",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_15__1",
    "label": "Inv Contact Name",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text71__1",
    "label": "Invoice Phone",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_21__1",
    "label": "Store Name",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_22__1",
    "label": "Store Number",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_24__1",
    "label": "Store Address",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_25__1",
    "label": "Store City",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_26__1",
    "label": "Store State",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_27__1",
    "label": "Store Zip",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_23__1",
    "label": "Store Contact",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_30__1",
    "label": "Store Phone",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_31__1",
    "label": "Email Address",
    "section": "Billing and Store Information",
    "type": "text"
  },
  {
    "key": "text_32__1",
    "label": "Description of Service",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text81__1",
    "label": "Labor Description",
    "section": "Items and Pricing",
    "type": "text"
  },
  {
    "key": "text06__1",
    "label": "Labor Price",
    "section": "Items and Pricing",
    "type": "text"
  },
  {
    "key": "text32__1",
    "label": "Travel Description",
    "section": "Items and Pricing",
    "type": "text"
  },
  {
    "key": "text0__1",
    "label": "Travel Price",
    "section": "Items and Pricing",
    "type": "text"
  },
  {
    "key": "text14__1",
    "label": "AM Description",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "additional_info__1",
    "label": "Additional Info",
    "section": "Additional Information",
    "type": "textarea"
  },
  {
    "key": "text7__1",
    "label": "Tech 1",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text9__1",
    "label": "Tech 2",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "hour__1",
    "label": "Time In",
    "section": "Service and Labor",
    "type": "time"
  },
  {
    "key": "hour6__1",
    "label": "Time Out",
    "section": "Service and Labor",
    "type": "time"
  },
  {
    "key": "text61__1",
    "label": "Multiple Day Hours",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text322__1",
    "label": "# Of Techs",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "total_shopping_cart__1",
    "label": "Total Shopping Cart",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "total_backroom__1",
    "label": "Total Backroom",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "total_ada__1",
    "label": "Total ADA",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "__scrapped__1",
    "label": "# Scrapped",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "__repaired__1",
    "label": "# Repaired",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "__cleaned__1",
    "label": "# Cleaned",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "__unavailable__1",
    "label": "# Unavailable",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "text5__1",
    "label": "In House Refurbs",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text772__1",
    "label": "Freight",
    "section": "Items and Pricing",
    "type": "text"
  },
  {
    "key": "text_65__1",
    "label": "WH515PO QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text6__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_66__1",
    "label": "CC5SW QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text92__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_69__1",
    "label": "Leg Hole Closure QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_67__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_68__1",
    "label": "Seat Belt QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text87__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_70__1",
    "label": "HDL QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_71__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text85__1",
    "label": "Part Description 1",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text39__1",
    "label": "QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text70__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text75__1",
    "label": "Part Description 2",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text72__1",
    "label": "QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text50__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text79__1",
    "label": "Part Description 3",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text03__1",
    "label": "QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text01__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text4__1",
    "label": "Part Description 4",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text40__1",
    "label": "QTY",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text84__1",
    "label": "Price",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_78__1",
    "label": "WO Additional Info",
    "section": "Service and Labor",
    "type": "text"
  },
  {
    "key": "text_79__1",
    "label": "Closed Out By",
    "section": "Completion",
    "type": "text"
  },
  {
    "key": "closed_out_date4__1",
    "label": "Closed Out Date",
    "section": "Completion",
    "type": "date"
  },
  {
    "key": "completedMiles",
    "label": "Miles (additional completed-board field)",
    "section": "Service and Labor",
    "type": "number"
  },
  {
    "key": "completedNotes",
    "label": "WO Additional Info (additional completed-board field)",
    "section": "Service and Labor",
    "type": "textarea"
  }
];
export const fieldKeys = new Set(["name", "dateEntered", "status", ...orderFields.map(field => field.key)]);
