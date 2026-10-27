# Simplified MVP and presentation plan

## One complete workflow

A resident enters a Pennsylvania ZIP/city, chooses food or healthcare, sees nearby fictional sample services in a synchronized list/map, opens a service detail and sees its hours, eligibility and contact fields. The screen clearly says “Fictional demo” and disables call/directions where no real destination exists. A team member signs in with Google, edits a demo service assigned to their organization, and the resident view reflects the update. An anonymous visitor can file a correction report; an admin can see it and hide the record.

This demonstrates the backend's core path without asserting that real providers have been verified or that donations work.

## What to present in two days

1. **Architecture slide:** the diagram in [architecture](architecture.md) — Vite UI → one API → PostgreSQL; Supabase Auth/Google for accounts; maps/geocoding.
2. **Data slide:** organization → service location → service, plus categories, hours, memberships, reports and demo campaigns.
3. **API slide:** ZIP/city resolve → resource search → detail; then Google sign-in → authorized edit → report inbox.
4. **Scope slide:** Pennsylvania only, fictional seed data, no verification badges, no live payments, no AI.
5. **Decision slide:** the few remaining choices in [open questions](open-questions.md).

A clickable app is useful if it already exists, but the presentation can use the existing UI prototype and these diagrams/contracts. Do not imply the proposed API or Google login is implemented unless the team has actually built and tested it.

## Implementation order after the presentation

| Order | Work | Handoff |
| --- | --- | --- |
| 1 | Agree on field names, PA demo cities, map behavior and fictional seed content | Michael/Adam with Jasurbek |
| 2 | Configure Google OAuth/Supabase Auth and create private database tables | Jasurbek with Penuel |
| 3 | Add location resolver, service search/detail and simple report routes | Jasurbek |
| 4 | Connect map/list/detail UI to the API, with visible demo labels and empty/error states | Adam |
| 5 | Add Google sign-in, `/me` and assigned-organization editing | Jasurbek + Adam |
| 6 | Walk through the full resident and staff flow; check mobile/accessibility and permissions | Whole team, coordinated by Penuel |

Supabase documents Google provider setup and Vercel documents root `api/` Functions for Vite apps. These are proposed implementation paths, not current features of this repository. [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Acceptance criteria for a later working prototype

- Anonymous search works for supported Pennsylvania demo locations and both categories; list and map show the same current-page records, including no-result and invalid-location states.
- Resource detail shows available fields and clearly marks fictional data. Demo call, directions and donation controls do not lead to real actions.
- A new Google account can sign in, but cannot edit until a team admin assigns an organization membership. An editor can update only that organization's records. Stale concurrent edits return 409.
- A correction report can be sent anonymously, appears only to an admin, and can lead to a record being hidden.
- No screen or API response claims “verified,” “last verified,” live service availability or real campaign progress.

## Teammate handoffs

- **Adam — frontend:** screen-to-route mapping, list/map behavior, Google sign-in button, demo labels, no-result states and mobile layout.
- **Michael — product/UX:** plain-language disclaimer, key resident journey, category labels and which donor screens remain demo-only.
- **Penuel — technical coordination:** review the single-service architecture, account/provider ownership and integration checklist.
- **Jasurbek — backend/data:** schema, API contract, Google session checks, organization ownership checks and seed-data boundaries.

These are suggested responsibilities from the team roles discussion document, not unilateral assignments.

## Donation scope

Campaign cards and goals/progress can be seeded fictional data. The one-time/monthly selector may be shown as visual design only; “Donate now” must be disabled or explicitly demo-only. Real payments need a separate provider setup, checkout, webhooks, refunds and accounting. Stripe Checkout supports payment and subscription modes, but there is no payment route in this MVP. [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create).
