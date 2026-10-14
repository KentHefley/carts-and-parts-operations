import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { renderToStaticMarkup } from "react-dom/server";
import { type ReactNode } from "react";

// Exercise the actual server page with isolated identity/navigation boundaries.
// This does not alter authentication or introduce a route in the running app.
test("access feedback separates admin restriction from missing approval and recovers stale denial", async () => {
  const fixture: { user: { id: string; role: "USER" | "ADMIN" } | null } = { user: null };
  const result = await build({ entryPoints: ["app/access-denied/page.tsx"], bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic", packages: "external", plugins: [{ name: "isolated-access", setup(b) {
    b.onResolve({ filter: /lib\/access$/ }, () => ({ path: "access", namespace: "fixture" }));
    b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
    b.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
    b.onResolve({ filter: /^@clerk\/nextjs$/ }, () => ({ path: "clerk", namespace: "fixture" }));
    b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", resolveDir: process.cwd(), contents: {
      access: "export async function getApprovedUser(){return globalThis.user}",
      navigation: "export function redirect(url){throw new Error('REDIRECT:'+url)}",
      link: "import {createElement} from 'react'; export default function Link(props){return createElement('a',props)}",
      clerk: "export function UserButton(){return null}",
    }[args.path] }));
  } }] });
  const compiled = { exports: {} as { default: (props: { searchParams: Promise<{ reason?: string }> }) => Promise<ReactNode> } };
  new Function("require", "module", "exports", "globalThis", result.outputFiles[0].text)(createRequire(`${process.cwd()}/package.json`), compiled, compiled.exports, fixture);
  const page = (reason?: string) => compiled.exports.default({ searchParams: Promise.resolve({ reason }) });
  assert.match(renderToStaticMarkup(await page()), /Access needs approval/);
  fixture.user = { id: "synthetic", role: "USER" };
  await assert.rejects(page(), /REDIRECT:\/$/);
  const restricted = renderToStaticMarkup(await page("admin"));
  assert.match(restricted, /Administrator access required/);
  assert.match(restricted, /Your employee account is approved/);
  assert.match(restricted, /href="\/"/);
  assert.doesNotMatch(restricted, /Access needs approval/);
  fixture.user = { id: "synthetic", role: "ADMIN" };
  await assert.rejects(page("admin"), /REDIRECT:\/$/);
});
