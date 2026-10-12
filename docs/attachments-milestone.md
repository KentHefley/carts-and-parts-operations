# Private order attachments — October 11, 2026

## Confirmed scope

Kent approved PDF, JPG/JPEG, PNG and WebP, up to 20 MB per file, preserving original bytes and quality. Kent created the company Cloudflare account, activated R2 billing, configured the private development bucket and credentials, and saved localhost PUT CORS. No purchase or subscription was activated by the agent.

Assigned employees and admins may upload/delete; all approved users may list, preview and download. Complete/Voided retain the same files. Individual deletion cannot be restored. Files are excluded from SO email and copied orders. Record uploads/deletions in immutable order history and notify other active users according to requirements.md.

## Implementation plan

1. Establish company-owned Cloudflare account and private development bucket. Keep public access disabled. Kent handles billing activation; do not assume free allowance prevents charges. Separate future live storage/credentials.
2. Add versioned metadata migration: order ID, generated storage key, original filename, verified content type/size, uploader, timestamps and explicit upload/deletion states. Preserve deletion metadata for audit. Verify development target before applying.
3. Implement permission-checked upload initiation/finalization, private preview/download and deletion. Use short-lived scoped upload access compatible with hosted request-size limits. Never route 20 MB through a Server Action. Recheck permission on finalization, validate actual stored bytes/type/size and prevent incomplete uploads from becoming viewable.
4. Add Files tab alongside existing order navigation, file input and drag/drop, upload progress/errors, metadata list, preview/download and authorized delete controls. Preserve unsaved form navigation protection.
5. Use durable pending cleanup state and retryable cleanup for abandoned uploads and failed storage deletion. Record deletion and hide access before cleanup; do not leave untracked objects after DB/storage failures. Define upload expiry and cleanup execution mechanism before release.

## Acceptance and verification

- Authorized upload succeeds, displays filename/size/uploader/time and preserves downloaded original bytes.
- Unassigned user can view/download but cannot upload/delete, including direct endpoint calls. Signed-out, inactive and unapproved users cannot access any file.
- MIME/extension spoofing, unsupported types, empty/oversize files and manipulated order/storage IDs are rejected. No public bucket or permanent public links.
- Pending uploads are private/unavailable; duplicate finalization/deletion does not duplicate history or notifications.
- Storage failures preserve a recoverable tracked state and show useful feedback. Retried cleanup is safe.
- Complete, Voided and reopened order retain associations. Trash access/cleanup integrates with later whole-order deletion/restoration implementation before that milestone ships.
- Upload/delete create readable per-order events and notification behavior; downloads do not send email.
- Verify browser upload, preview, download, delete, keyboard controls, canceled uploads and failures, plus production build/lint and server permission tests.

## Setup notes

Create a private bucket such as `carts-parts-operations-development`, using Standard storage. Use bucket-scoped object read/write credentials stored only in ignored `.env.local`. Configure browser CORS for the exact development origin when direct uploads are implemented. Do not expose credentials in chat or client code. No domain transfer or DNS changes are required for the application to use the R2 API.

Official references checked October 11: https://developers.cloudflare.com/r2/get-started/ ; https://developers.cloudflare.com/r2/pricing/ ; https://developers.cloudflare.com/r2/api/s3/presigned-urls/

Implementation update: the Files tab, permission-controlled upload/finalization, private preview/download, deletion, audit/notifications and admin retry cleanup are implemented. AWS SDK 3.1149.0 is pinned, the attachment migration is applied to development, and synthetic permission/idempotency/type/retention/recovery tests plus real development R2 original-byte upload/read/delete checks passed. Local CORS preflight passed after Kent saved the policy. Public-access settings still require Kent's confirmation. Individual staging cleanup currently needs the admin retry control; unattended cleanup/lifecycle setup remains a pre-pilot task. Whole-order expiration cleanup is documented separately in trash-milestone.md and deployment.md.
