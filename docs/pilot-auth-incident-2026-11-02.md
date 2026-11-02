# Pilot page-load investigation — November 2, 2026

Kent reported an unavailable-page screen with Reload while navigating back during another admin's editing session, approximately 11:15 AM America/Chicago. Reload restored normal operation. The exact SO number was not supplied.

## Evidence

- Inspected Pilot runtime and request logs for 17:05–17:25 UTC (11:05–11:25 AM CST). Vercel MCP error-cluster access returned 403; the explicitly scoped company CLI log fallback succeeded.
- At **17:12:33.869 UTC / 11:12:33.869 AM CST**, GET `/sales-orders` logged a Clerk `api_response_error`: **502 Bad Gateway**, `clerkError: true`, digest `3667942597`, Clerk trace `a544c3cb9cbfd42d-IAD`. Deployment: `dpl_Erjauvd89H84kTdBaq8soicXbbRD`. Request ID: `mk8x7-1793639553783-a9135f10f05b`.
- The same request's CDN record reported HTTP 200. A 200 alone is therefore not proof that the streamed page rendered successfully; the runtime exception is decisive evidence of the page's dependency failure.
- Another GET `/sales-orders` arrived at 17:12:37.020 UTC, followed by GET `/orders/[id]` at 17:12:44.766 UTC. No further Clerk exception appears in the inspected window. This is consistent with recovery after reload, but logs cannot conclusively identify Kent's browser or exact reported screen.
- Two other stderr records were node-postgres deprecation warnings during order POSTs at 17:10:23 and 17:14:55 UTC. They are not database timeout or concurrency-conflict exceptions. No such fatal database/save exception appeared in the inspected runtime window. The focused request window (17:10–17:17 UTC) returned 76 records, no pagination remainder.
- `lib/access.ts` calls Clerk `currentUser()` during page approval checks. A provider exception propagates instead of producing a tailored recovery screen. The source tree has no application `error.tsx` boundary. Normal order conflicts are separately handled in the order form.

## Finding and follow-up

The Clerk 502 is a strong candidate for the reported incident, given its timing and subsequent requests. It does **not** prove a wider Clerk outage or a collision caused by the other employee. No evidence of lost order data was found in this log review; this was not a field-by-field data reconciliation.

Recommended hardening before production: a bounded retry for eligible transient, read-only identity lookups, with a clear in-app recovery state if the dependency still fails. Do not retry mutations blindly, reuse stale approvals, or weaken role/deactivation checks. Review installed Clerk caching/retry behavior before implementation and test both transient recovery and persistent failure.

This task was investigation only: no application, permission, database, or deployment changes. Raw logs remain in ignored `tmp/`; this note contains only the relevant sanitized incident metadata. Kent's two other form edits remain pending details/approval.
