# Development authentication setup

October 7, 2026. Local Next.js 16.3.8 uses Clerk Next.js SDK 7.9.11. Existing development keys in `.env.local` were preserved. No replacement Clerk application, account, invitation, database migration or deployment was created.

The root provider lives inside `body`. `proxy.ts` establishes request authentication; the home page enforces authentication at the server resource using `auth.protect()`, following Clerk's current resource-protection guidance. Every future privileged page, action and API must enforce its own checks. `/sign-in/[[...sign-in]]` renders Clerk's sign-in component. The protected home page is a development setup screen with account/sign-out controls, not an implemented order dashboard. No public signup route was added.

## Required Clerk dashboard settings

Kent confirmed Invite-only access and the password setting, and disabled self-service account deletion/email changes. These settings were reported by Kent, not independently inspected by the agent. Confirm social providers are disabled; keep MFA deferred. Merely omitting a signup route does not enforce invitation-only access at the provider. Clerk's prebuilt sign-in component supports password recovery through the enabled email identifier; test that flow rather than seeking a separate recovery toggle.

Create or invite only approved employee accounts. Initial administrator provisioning and database-backed active-user/role checks remain part of Milestone 1; authentication alone does not provide those permissions. Do not expose company records until those checks are implemented and verified.

Reference: https://clerk.com/docs/guides/secure/restricting-access

## Verification

- Lint completed with zero errors; one warning comes from an existing TanStack example inside `.agents/skills`, outside application code.
- Production build and TypeScript checking succeeded; final build outcome is recorded in progress.md.
- Browser verification confirmed `/` redirects a signed-out visitor to the local `/sign-in` page and Clerk's form renders.
- Next.js runtime MCP returned no compilation issues or runtime/configuration errors. React introspection failed because the browser tooling did not install its DevTools hook; component-level introspection remains unverified.
- Kent successfully accepted his invitation and signed into the local application, supported by his screenshot. Sign-in involved a code, so the exact authentication method remains to be verified. Password-based sign-in, password recovery, logout and employee approval/deactivation still require testing.
- npm audit reports five high-severity entries in the existing ESLint dependency chain, originating from a `braces` advisory. No forced downgrade or unrelated dependency rewrite was applied. Resolve this tooling advisory before release.

Run `npm run dev`, then visit http://localhost:3000. Real credentials stay in ignored `.env.local`; `.env.example` contains placeholders only.
