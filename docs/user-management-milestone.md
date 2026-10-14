# User management milestone

Super Admin follow-up: protect Kent's exact approved email account from demotion/deactivation, hide its edit controls, and display Super Admin. Test both another admin and self requests at the server boundary; verify the real development Kent record remains active Admin and unchanged. This is a protected designation over existing Admin permissions, not a new authentication bypass or additional assignable role.

Implement an admin-only employee list with explicit role/access saves and recent immutable access history. Preserve accounts, authorship, assignments and calendar people. Invitations remain a later milestone.

Acceptance: server checks active administrator permission inside a serialized transaction; reject stale edits; never remove the last active admin; duplicate saves create no duplicate history. Deactivation blocks subsequent protected app requests, without claiming to revoke Clerk sessions or already issued short-lived file URLs.

Verify regular/inactive users cannot mutate, stale saves fail, role/access updates and retries work, last-admin protection works with competing requests, and records/history remain. Run focused lint, access tests, guarded development database tests and a production build. Kent reviews the authenticated UI.
