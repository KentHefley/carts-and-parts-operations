import assert from "node:assert/strict";
import test from "node:test";
import { expiredBackups, cleanupExpiredBackups, backupPattern } from "../scripts/backup-retention.mjs";

const now = Date.parse("2026-10-16T10:17:00Z");
const name = (char) => `development-${char.repeat(24)}.cnpbackup`;
const file = (char, age = 0) => ({ ".tag": "file", name: name(char), path_lower: `/${name(char)}`, id: `id:${char}`, rev: "abc123", server_modified: new Date(now - age * 86400_000).toISOString() });

test("pilot and development retention cannot delete each other's archives", async () => {
  const pilotFile = (char, age = 0) => { const entry = file(char, age); return { ...entry, name: entry.name.replace("development-", "pilot-"), path_lower: entry.path_lower.replace("development-", "pilot-") }; };
  const current = pilotFile("a");
  const oldPilot = pilotFile("b", 31);
  const oldDevelopment = file("c", 31);
  assert.deepEqual(expiredBackups([oldPilot, oldDevelopment], current.name, now, "pilot"), [oldPilot]);
  assert.deepEqual(expiredBackups([oldPilot, oldDevelopment], name("a"), now), [oldDevelopment]);
  assert.throws(() => backupPattern("live"));
  assert.throws(() => backupPattern("../pilot"));
  await assert.rejects(cleanupExpiredBackups(async () => { throw Error("must not call"); }, current, now));
  const deleted = [];
  await cleanupExpiredBackups(async (endpoint, body) => {
    if (endpoint === "files/list_folder") return { entries: [current, oldPilot, oldDevelopment], has_more: false };
    deleted.push(body.path); return {};
  }, current, now, "pilot");
  assert.deepEqual(deleted, [oldPilot.id]);
});

test("retention owns exact root archives only and preserves the 30-day boundary", () => {
  const old = file("a", 31);
  const entries = [old, file("b", 30), file("c", 29), file("d", -1), { ...file("e", 40), ".tag": "folder" }, { ...file("f", 40), path_lower: `/other/${name("f")}` }, { ...file("1", 40), server_modified: "bad" }, { ...file("2", 40), name: "backup.key" }, { ...file("3", 40), rev: undefined }, file("4", 40)];
  assert.deepEqual(expiredBackups(entries, name("4"), now), [old]);
});

test("pagination completes before any deletion; deletion uses identity and expected revision", async () => {
  const current = file("a");
  const old = file("b", 31);
  const calls = [];
  const rpc = async (endpoint, body) => {
    calls.push([endpoint, body]);
    if (endpoint === "files/list_folder") return { entries: [current], has_more: true, cursor: "next" };
    if (endpoint === "files/list_folder/continue") return { entries: [old], has_more: false };
    return {};
  };
  assert.equal(await cleanupExpiredBackups(rpc, current, now), 1);
  assert.deepEqual(calls.map(([endpoint]) => endpoint), ["files/list_folder", "files/list_folder/continue", "files/delete_v2"]);
  assert.deepEqual(calls[2][1], { path: old.id, parent_rev: old.rev });
});

test("stale verification, missing newest archive or listing failure cannot delete", async () => {
  const current = file("a");
  const deleted = [];
  const rpc = async (endpoint) => { if (endpoint === "files/delete_v2") deleted.push(endpoint); return { entries: [file("b", 40)], has_more: false }; };
  await assert.rejects(cleanupExpiredBackups(rpc, file("a", 1), now));
  await assert.rejects(cleanupExpiredBackups(rpc, current, now));
  await assert.rejects(cleanupExpiredBackups(async (endpoint) => {
    if (endpoint === "files/list_folder") return { entries: [current, file("b", 40)], has_more: true, cursor: "next" };
    throw Error("Provider unavailable");
  }, current, now));
  assert.deepEqual(deleted, []);
});

test("deletion conflict stops subsequent removals", async () => {
  const current = file("a");
  let deletes = 0;
  await assert.rejects(cleanupExpiredBackups(async (endpoint) => {
    if (endpoint === "files/list_folder") return { entries: [current, file("b", 40), file("c", 40)], has_more: false };
    deletes += 1;
    throw Error("Revision conflict");
  }, current, now));
  assert.equal(deletes, 1);
});
