# Development backup and restoration verification

## Acceptance criteria

- Preserve the current development database and original R2 objects.
- Capture a consistent PostgreSQL snapshot and all READY attachment/price-book bytes referenced by it, including retained Trash attachments.
- Encrypt the archive before retaining it; exclude archives, keys and portable tools from Git.
- Restore into a newly named, isolated development database and a unique private R2 prefix.
- Compare every public table's rows and restored file checksums. Remove only the drill database and objects created by that run.

This first drill does not authorize production deployment or establish automatic backups. In-flight uploads are not committed files and are excluded from the file backup. Keep uploads/replacements/deletions paused during capture: PostgreSQL and R2 do not share a transaction.

## Tools and procedure

Use PostgreSQL 18 clients for the current PostgreSQL 18 development server. Portable Windows binaries are available from the [official PostgreSQL Windows page](https://www.postgresql.org/download/windows/). Place pg_dump.exe, pg_restore.exe and their DLL dependencies in `.recovery-tools/bin/`.

Neon requires an [unpooled connection for pg_dump](https://neon.com/docs/manage/backup-pg-dump). The development script verifies the existing exact test target and derives its unpooled endpoint internally. Credentials are supplied through child-process environment variables, never command arguments or output.

Run `npx tsx scripts/backup-development.ts backup`, then `npx tsx scripts/backup-development.ts drill <archive-filename>`. The script prints filenames and counts only. Archives and the randomly generated AES-256 key live in ignored `.recovery/`. Copy the key separately into a company-owned password manager and copy encrypted archives to a separate company-controlled backup destination; a key and archive kept only on this computer do not provide disaster recovery.

The drill creates a database named `recovery_drill_<random hex>` on the verified development branch. It never restores over neondb or existing storage keys. It restores R2 bytes to `development/recovery-drills/<same identifier>/...`, validates them, then deletes only its own objects/database. A cleanup failure is a failed drill and requires investigation. Do not expose this temporary database through the application.

## Remaining release decisions

Agree backup frequency, retention, off-device destination, ownership, recovery-time and acceptable-data-loss targets. Verify the actual Neon restore window/plan in its dashboard; do not assume provider defaults. Arrange scheduled encrypted backups and failure monitoring, then repeat restoration periodically. Database backups alone do not preserve the PDF/image bytes held in R2. Clerk account recovery, environment secrets and deployment rollback also need separate company-owned recovery instructions.

## October 16 verification

Encrypted archive `development-fbcdec476ff60fdbb039dcdf.cnpbackup` captured all 25 public tables and three READY price books (14,606,434 original file bytes). PostgreSQL 18.6 pg_dump/pg_restore used full TLS verification with Node's trusted root certificate bundle. Restored every table into a newly created development database and compared deterministic row counts/SHA-256 fingerprints, including migration records. Restored each original PDF into a unique private R2 prefix and compared SHA-256 checksums after downloading it. All matched. Temporary database and three restored objects were removed successfully; original database and objects were not overwritten.

No READY order attachments existed at capture time, so this verifies real price-book storage and database records but does not prove recovery of a populated order/attachment association. Add a synthetic attachment scenario before live readiness. No automated backup schedule or independent off-device copy has been established. Plaintext temporary dumps are removed after normal success/failure; an abruptly terminated process can leave a `.partial.dump` or `.restore.dump` inside ignored `.recovery/`, requiring secure local cleanup. This bounded pilot implementation caps original file bytes at 250 MB and decrypts in memory; larger deployments need streaming archives.
