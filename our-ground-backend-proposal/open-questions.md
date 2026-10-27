# Assumptions and remaining team decisions

## Defaults used for the two-day presentation

These assumptions make the proposal concrete; they are **not approved commitments**.

| Topic | Assumed first-version choice |
| --- | --- |
| Geography | Pennsylvania only. Demo records cover a few PA cities, not the entire state. |
| Resident access | Anonymous search and details. Google sign-in is optional. |
| Staff access | Anyone may create a Google account; an admin manually grants editor access to one organization. |
| Resource status | Simple `draft`, `published`, `hidden`. No independent verification, badge, expiry or reviewer queue. |
| Data | Conspicuously fictional seed records for the presentation. Real records later need a source URL/date and a maintenance owner. |
| Donations | Fictional campaign display; no live one-time or monthly payments. |
| AI | No AI in the MVP. |
| Technology | Existing Vite frontend, one TypeScript API, Supabase PostgreSQL/Auth with Google, Mapbox map/geocoding — proposed, not provisioned. |

## Decisions to agree on before implementation

| Priority | Question | Recommended default / teammate |
| --- | --- | --- |
| First | Which PA cities appear in the demo? | Harrisburg plus one or two other cities with **fictional** records. Michael + Adam. |
| First | Who owns the Google OAuth and Supabase setup? | One team-owned project; Penuel coordinates access, Jasurbek configures auth. Google OAuth needs a registered client and callback. [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google). |
| First | Who can be an organization editor? | Only team demo accounts manually assigned by an admin; no self-claiming. Whole team. |
| First | Which map/geocoding account and spending limit? | Try Mapbox only after a named owner checks current terms and quota. Penuel + Adam. [Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/). |
| Next | When may real provider contact/directions data appear? | Only after source permission, source URL/date and an owner for corrections are in place. Michael + Jasurbek. |
| Next | Will the donation screens link to an external provider or remain demo-only? | Demo-only until separately agreed. Whole team. |
| Later | What is the formal verification policy? | Design after the first search/edit workflow works and someone can own ongoing checks. Whole team. |
| Later | Is AI worth adding? | Only after useful sourced records and a measurable use case exist. Penuel + Jasurbek. |

## What to say in the meeting

“We propose a Pennsylvania-only prototype. People can search without signing in. Google sign-in creates an account, and team-assigned editors can update their organization's demo records. The map and donation screens use clearly fictional sample data. We are intentionally not claiming verification or accepting donations yet.”

After the presentation, record any changes here and then freeze the [API contract](api-contract.md) with the frontend teammate before coding. Provider capabilities were checked against official docs on 27 October 2026; costs and account terms should be rechecked when accounts are created.
