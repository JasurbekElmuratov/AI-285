# Our Ground — simplified backend proposal

**Presentation draft · 27 October 2026.** This is a proposed prototype, not an approved implementation or a live resource directory. The working assumption is **Pennsylvania only**, Google sign-in for accounts, and **no verification workflow in the first version**.

Implementation now lives in [backend](../backend/README.md). Resident screens are connected to the API; see [setup](../backend/SETUP.md) and [actual verification status](../backend/VERIFICATION.md). This proposal includes future features and must not be read as proof that real Supabase/Google services were tested.

## Product and first version

Our Ground helps Pennsylvania residents find food assistance and free or low-cost healthcare. Donors can browse organizations and example campaigns. The backend stores organizations, their locations and services; answers ZIP/city and category searches; handles optional accounts and staff editing; and accepts reports of inaccurate information.

The presentation workflow is: search within Pennsylvania → see a map/list → open a service → view available contact/directions information. A team member signs in with Google, edits a demonstration record, and the updated record appears. No reviewer approval or “verified” badge is part of this version.

**Anyone can browse without an account.** Google sign-in creates an account for someone who wants one, but a new account has no organization editing rights. A team admin assigns those rights manually for the prototype.

## What the references show

All nine PNGs in `/Users/jasurbekelmuratov/Desktop/ui` were inspected. The four “looking for help” screens show ZIP/city search, food/healthcare filters, map/list results, distance, service details, contact/directions and an incorrect-information link. The five “for orgs” screens show organization discovery, campaign cards/details, goals/progress, donation controls and proposed verification messaging. The attached team roles PDF describes this backend/data deliverable as a discussion draft.

The mockups are design references. Their names, counts, addresses, phone numbers, dates, donation totals, impact claims and verification badges are **not evidence of real services or transactions**. For the presentation, use conspicuously fictional seed records. If the team later adds real public records, store a source URL and source-check date, show “Information has not been independently verified by Our Ground,” and ask visitors to confirm with the provider before visiting. Fictional records must not have live call or directions actions.

## Assumed scope for the two-day presentation

- Pennsylvania is the only supported state. Seed a few Pennsylvania cities for the demo; do not claim statewide coverage.
- Food and healthcare are the two searchable service categories. Map/list and service detail are the central workflow.
- Keep the existing Vite/TypeScript prototype. Propose one TypeScript API, PostgreSQL, Supabase Auth with Google, and a map/geocoding provider.
- Use simple `draft`/`published`/`hidden` content status. There is no reviewer queue, independent approval, expiry date or “last verified” field in the MVP.
- Donation campaigns are **fictional display data**. “Donate now” and monthly giving are disabled or marked demo-only; no money moves.
- AI is optional and outside this first version.

## Read the proposal

1. [Architecture](architecture.md) — one backend and a simple diagram.
2. [Data model](data-model.md) — distinct organizations, locations and services.
3. [API contract](api-contract.md) — frontend routes and examples.
4. [Auth and permissions](auth-and-permissions.md) — Google sign-in and editing rights.
5. [Data and accuracy](data-and-verification.md) — demo labels, sources and reports; formal verification later.
6. [MVP plan](mvp-plan.md), [AI options](ai-options.md), [open questions](open-questions.md).

Official documentation is linked beside researched technical claims. This folder is ready for team discussion; no application code, cloud service or deployment is created by these files.
