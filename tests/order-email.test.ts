import { test } from "node:test";
import assert from "node:assert/strict";
import { orderEmailTemplate } from "../lib/order-email-template";
import { verifyEmailRecipients } from "../lib/email-config";

test("fixed selection preserves field blanks, omits unused items, escapes HTML and excludes prices", () => {
  const result = orderEmailTemplate({ id: "test", number: "DEV-000001", creator: "Kent Hefley", assigneeIds: [], fields: { text_13__1: "<script>&\"", text06__1: "SECRET_LABOR_PRICE", text0__1: "SECRET_TRAVEL_PRICE", text_32__1: "SECRET_RETIRED_SERVICE", text14__1: "SECRET_RETIRED_AM", unexpected: "SECRET_EXTRA_FIELD" }, items: [
    { quantity: "2.5", description: "CW2 refill", unitPrice: "SECRET_UNIT_PRICE" },
    ...Array.from({ length: 3 }, () => ({ quantity: "", description: "", unitPrice: "" })),
  ] });
  assert.equal(result.subject, "SALES ORDER: DEV-000001");
  assert.match(result.text, /Division: \n/);
  assert.match(result.text, /Item 1 Quantity: 2.5\nItem 1 Description: CW2 refill/);
  assert.doesNotMatch(result.text + result.html, /Item [234] (Quantity|Description)/);
  assert.match(result.text, /Freight: \n\nInvoice To:/);
  assert.match(result.text, /Invoice Phone: \n\nStore Name:/);
  assert.match(result.text, /Email: \n\nMiles: \nItem 1 Quantity:/);
  assert.doesNotMatch(result.text + result.html, /Description of Service|AM Description|Travel Price|Labor Price|Unit Price/);
  assert.equal((result.html.match(/margin:17px 0 0/g) ?? []).length, 3);
  assert.match(result.text, /Submitted By: Kent Hefley/);
  assert.match(result.html, /&lt;script&gt;&amp;&quot;/);
  assert.doesNotMatch(result.html, /<script>/);
  assert.doesNotMatch(result.text + result.html, /SECRET_/);
});

test("Miles zero is preserved immediately before items in text and HTML", () => {
  const result = orderEmailTemplate({ id: "test", number: "DEV-000001", creator: "Test user", assigneeIds: [], fields: { numbers__1: "0", text_32__1: "Old service", text14__1: "Old AM" }, items: [{ quantity: "1", description: "Sample wheel", unitPrice: "12.50" }] });
  assert.match(result.text, /Miles: 0\nItem 1 Quantity: 1/);
  assert.ok(result.html.indexOf("Miles:") < result.html.indexOf("Item 1 Quantity:"));
  assert.doesNotMatch(result.text + result.html, /Old service|Old AM|12\.50/);
});
test("partially filled items and zero quantities retain their original row numbers", () => {
  const result = orderEmailTemplate({ id: "test", number: "DEV-000001", creator: "Test user", assigneeIds: [], fields: {}, items: [
    { quantity: " ", description: "\t", unitPrice: "" },
    { quantity: "0", description: "", unitPrice: "" },
    { quantity: "", description: "Wheel", unitPrice: "" },
    { quantity: "", description: "", unitPrice: "12.34" },
  ] });
  assert.doesNotMatch(result.text + result.html, /Item 1 /);
  assert.match(result.text, /Item 2 Quantity: 0/);
  assert.match(result.text, /Item 3 Description: Wheel/);
  assert.match(result.text, /Item 4 Quantity: \nItem 4 Description:/);
  assert.doesNotMatch(result.text + result.html, /12\.34/);
});
test("development recipient policy rejects empty/mixed lists without redirecting", () => {
  assert.doesNotThrow(() => verifyEmailRecipients(["KENT@CARTSANDPARTS.COM"]));
  assert.doesNotThrow(() => verifyEmailRecipients(["kent@cartsandparts.com", "jleo3140@gmail.com", "augustforum@gmail.com", "hefleykent@gmail.com"]));
  assert.throws(() => verifyEmailRecipients(["other@orders.cartsandparts.com"]));
  assert.throws(() => verifyEmailRecipients(["kent@cartsandparts.com.evil.invalid"]));
  assert.throws(() => verifyEmailRecipients([]));
  assert.throws(() => verifyEmailRecipients(["kent@cartsandparts.com", "other@example.invalid"]));
});
