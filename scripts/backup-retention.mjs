export const backupNamePattern = /^development-[a-f0-9]{24}\.cnpbackup$/;
export function backupPattern(mode = "development") {
  if (mode !== "development" && mode !== "pilot") throw new Error("Unsupported backup environment.");
  return new RegExp(`^${mode}-[a-f0-9]{24}\\.cnpbackup$`);
}

// Only exact archive files at the dedicated app-folder root are owned by this job.
export function expiredBackups(entries, keepName, now = Date.now(), mode = "development") {
  const pattern = backupPattern(mode);
  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => entry[".tag"] === "file"
    && pattern.test(entry.name ?? "")
    && entry.path_lower === `/${entry.name}`
    && entry.name !== keepName
    && typeof entry.id === "string" && entry.id.startsWith("id:")
    && typeof entry.rev === "string" && /^[a-f0-9]+$/.test(entry.rev)
    && Number.isFinite(Date.parse(entry.server_modified))
    && Date.parse(entry.server_modified) < cutoff);
}

export async function cleanupExpiredBackups(rpc, verified, now = Date.now(), mode = "development") {
  if (!backupPattern(mode).test(verified.name ?? "") || !Number.isFinite(Date.parse(verified.server_modified))
    || now - Date.parse(verified.server_modified) < 0 || now - Date.parse(verified.server_modified) > 3600_000) {
    throw new Error("Retention requires a newly uploaded and verified archive.");
  }
  let page = await rpc("files/list_folder", { path: "", recursive: false, include_deleted: false, limit: 2000 });
  const entries = [...page.entries];
  while (page.has_more) {
    page = await rpc("files/list_folder/continue", { cursor: page.cursor });
    entries.push(...page.entries);
  }
  if (!entries.some((entry) => entry[".tag"] === "file" && entry.name === verified.name && entry.id === verified.id && entry.rev === verified.rev)) {
    throw new Error("Verified archive changed before retention; no cleanup performed.");
  }
  const expired = expiredBackups(entries, verified.name, now, mode);
  for (const entry of expired) {
    await rpc("files/delete_v2", { path: entry.id, parent_rev: entry.rev });
  }
  return expired.length;
}
