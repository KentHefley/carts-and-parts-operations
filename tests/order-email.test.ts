import { test } from "node:test";
import assert from "node:assert/strict";
import { orderEmailTemplate } from "../lib/order-email-template";
import { verifyEmailRecipients } from "../lib/email-config";

test("fixed selection preserves blanks and all rows, escapes HTML, excludes prices and unselected fields", () => {
  const result = orderEmailTemplate({ id: "test", number: "DEV-000001", creator: "Kent Hefley", assigneeIds: [], fields: { text_13__1: "<script>&\"", text06__1: "SECRET_LABOR_PRICE", text0__1: "SECRET_TRAVEL_PRICE", unexpected: "SECRET_EXTRA_FIELD" }, items: [
    { quantity: "2.5", description: "CW2 refill", unitPrice: "SECRET_UNIT_PRICE" },
    ...Array.from({ length: 3 }, () => ({ quantity: "", description: "", unitPrice: "" })),
  ] });
  assert.equal(result.subject, "SALES ORDER: DEV-000001");
  assert.match(result.text, /Division: \n/);
  assert.match(result.text, /Item 4 Quantity: \nItem 4 Description: /);
  assert.match(result.text, /Submitted By: Kent Hefley/);
  assert.match(result.html, /&lt;script&gt;&amp;&quot;/);
  assert.doesNotMatch(result.html, /<script>/);
  assert.doesNotMatch(result.text + result.html, /SECRET_/);
});
test("development recipient policy rejects empty/mixed lists without redirecting", () => {
  assert.doesNotThrow(() => verifyEmailRecipients(["KENT@CARTSANDPARTS.COM"]));
  assert.throws(() => verifyEmailRecipients([]));
  assert.throws(() => verifyEmailRecipients(["kent@cartsandparts.com", "other@example.invalid"]));
});
