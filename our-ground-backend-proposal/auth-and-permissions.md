# Authentication and permissions

## Simple account model

**Public search and detail pages never require login.** A visitor may choose “Continue with Google”; Supabase Auth creates/signs in that account, and the API creates an `app_users` row with default `user` role on first use. The account can browse or submit a correction report. A team admin manually assigns `editor` membership to a specific organization for the prototype. Google sign-in proves identity, **not** a right to edit an organization.

Supabase supports Google as a social sign-in provider. Setup requires a Google OAuth web client ID/secret, configured origins and Supabase callback URI. Request only basic profile/email identity scopes; no Gmail, Drive or other Google access. [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Google OAuth web setup](https://developers.google.com/identity/protocols/oauth2/web-server).

| Action | Anonymous visitor | Google user | Assigned organization editor | Admin |
| --- | --- | --- | --- | --- |
| Search/read public records | Yes | Yes | Yes | Yes |
| Submit correction report | Yes | Yes | Yes | Yes |
| Read own account/organizations | No | Yes | Yes | Yes |
| Create/edit service or location | No | No | Own organization | Any demo record |
| Change draft/published/hidden status | No | No | Own organization | Any demo record |
| Read/resolve private reports | No | No | No | Yes |
| Grant editor membership | No | No | No | Manual admin action |

## Protected request checks

1. Require a valid Supabase access token for `/me` and staff routes. Validate it server-side with Supabase Auth `getUser(token)`; do not trust an unsigned decoded token or a user ID supplied by the browser. [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
2. Read the user's Our Ground role and active organization memberships from the database. On every edit, load the target record and compare its owning organization. A Google email or an organization ID in the request body grants nothing.
3. For edits, compare `expected_version` and update the record in a transaction. A stale edit returns 409. Record `updated_at` and the editor's user ID for the staff audit trail.
4. Keep database credentials and the Google client secret on the server. Put application tables in a private schema outside the Supabase Data API's exposed schemas; use a restricted database role. If the team later exposes tables directly, add explicit grants and row-level security first. [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api).

## Privacy and presentation guardrails

Do not create resident profiles merely to search. Do not collect health history, household income, eligibility documents or precise device location. Search may use the entered ZIP/city without saving a personal history. Correction reports require no contact details; limit text length and restrict it to admins. Keep account email private and separate from an organization's public contact fields. Never store Google provider tokens unless a later feature genuinely needs them.

A fictional demo record cannot gain a working call/directions link because someone signed in or changed its status. `is_demo` is server-owned. No verification claim or availability guarantee is attached to a Google account or to an organization editor.

## Checks to demonstrate

An anonymous visitor can search. A new Google user can view `/me` but cannot edit. An assigned editor can update one organization's demo service but receives 404/403 on another's. An admin can hide a service and resolve a report. A stale `expected_version` returns 409.
