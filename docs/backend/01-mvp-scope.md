# First working version

## The project in one sentence

One directory where people can find checked local food support and learn how to help the organizations providing it.

## One complete journey

1. An authorized organization representative signs in.
2. They create a listing with its location, eligibility, hours and contact instructions.
3. They submit it for review.
4. A separate reviewer checks the information with the provider or an authoritative source.
5. The reviewer approves it and records when it must be checked again.
6. A resident selects their pilot area and searches for food assistance, without creating an account.
7. The resident opens the listing and sees the details and last verified date.
8. A donor can read the listing's support instructions and contact the organization outside Our Ground.

The first category is **food**. The pilot region is **Pennsylvania (`us-pa`)**, selected by Jasurbek. Start with a small set of food-support records in PA; statewide completeness is not promised. All sample providers are fictional. A first county or city for real data collection remains a team decision.

## Included

- Food-service listings with organization attribution.
- Search by pilot area, category and plain-text keyword.
- Detail page: description, eligibility, schedule, cost, preparation, contact, and verification date.
- Organization accounts provisioned through a manual pilot onboarding process.
- Drafting, editing, submitting and archiving an organization's own listings.
- Human review, approval, requests for changes and a review history.
- A contact route for residents and optional support instructions for donors.
- Clear empty, unavailable, expired, loading and error states in the frontend.

## Deferred

Healthcare and transportation categories, payments, appointment booking, donor accounts, automatic imports, live navigation, radius/nearest-service search, and AI recommendations. Public issue-reporting forms are also deferred; the pilot needs a visible operator contact route before real launch.

## Five fictional cases

See `examples/fixtures.json`; evaluation time is fixed at **2026-10-15T12:00:00Z** so checks are repeatable.

| Listing | Scenario | Publicly visible at the fixture time? |
| --- | --- | --- |
| Demo Neighborhood Pantry | Approved, current verification, walk-in groceries | Yes, in a local demo only |
| Demo Community Meals | Awaiting review, daily meal schedule | No |
| Demo Family Grocery Pickup | Changes requested because eligibility is unclear | No |
| Demo Fresh Food Table | Previously approved but verification expired | No |
| Demo Weekend Pantry | Archived after closure | No |

No real addresses, telephone numbers or real-provider claims are supplied. Reserved `.example` domains are deliberately non-operational. `is_demo` remains true for every fixture. Production public queries must exclude them even when their mock review status says approved.

## What counts as a successful first demo?

- An organization member can create, edit and submit its listing.
- An unrelated organization member cannot view private details or change that listing.
- The author, or anyone belonging to that organization, cannot approve it.
- A reviewer can approve the current submitted version with a review note.
- Only current, approved records appear in public results.
- Editing an approved record removes it from public results until a fresh approval.
- A resident sees useful service details and can follow a contact route.
- Public responses omit account IDs, reviewer identity and internal notes.
- A donor sees optional support instructions; no money is handled.
