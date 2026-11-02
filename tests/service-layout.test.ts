import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultLayout } from "../lib/custom-field-model";
import { revisedServiceLayout, retiredServiceFields } from "../lib/service-layout";
import { fieldKeys } from "../lib/order-fields";

test("new layouts hide retired service fields and put unchanged Miles immediately before items", () => {
  const layout = defaultLayout();
  for (const key of retiredServiceFields) {
    assert.equal(layout.fields.find(field => field.key === key)?.active, false);
    assert.ok(fieldKeys.has(key), "Historical field key must remain recognized.");
  }
  const visible = layout.fields.filter(field => field.active && !field.deleted && field.section === "Items and Pricing");
  assert.deepEqual(visible.slice(-2).map(field => field.key), ["text0__1", "numbers__1"]);
  assert.equal(visible.at(-1)?.type, "number");
});

test("existing layout update is immutable, scoped and idempotent", () => {
  const original = defaultLayout().fields;
  const miles = original.find(field => field.key === "numbers__1")!;
  const legacy = original.filter(field => field.key !== miles.key).map(field => retiredServiceFields.some(key => key === field.key) ? { ...field, active: true, used: true, revision: 9 } : field);
  legacy.push({ ...miles, section: "Service and Labor", help: "Keep this help", used: true, revision: 7 });
  const snapshot = JSON.stringify(legacy);
  const revised = revisedServiceLayout(legacy);
  assert.equal(JSON.stringify(legacy), snapshot);
  assert.deepEqual(revisedServiceLayout(revised), revised);
  const affected = new Set<string>(["numbers__1", ...retiredServiceFields]);
  assert.deepEqual(revised.filter(field => !affected.has(field.key)), legacy.filter(field => !affected.has(field.key)));
  assert.equal(revised.find(field => field.key === "numbers__1")?.help, "Keep this help");
  assert.equal(revised.find(field => field.key === "numbers__1")?.revision, 8);
  for (const key of retiredServiceFields) assert.equal(revised.find(field => field.key === key)?.revision, 10);
  assert.equal(revised.length, legacy.length);
});

test("unexpected core definitions/placement stop the update for review", () => {
  const fields = defaultLayout().fields;
  assert.throws(() => revisedServiceLayout(fields.filter(field => field.key !== "text0__1")), /Expected/);
  assert.throws(() => revisedServiceLayout(fields.map(field => field.key === "numbers__1" ? { ...field, custom: true } : field)), /Expected/);
  const extra = { ...fields[0], key: "custom_00000000-0000-4000-a000-000000000001", section: "Items and Pricing", custom: true };
  assert.throws(() => revisedServiceLayout([...fields, extra]), /Review fields after Travel Price/);
});
